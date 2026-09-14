import { opendir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

import { toPortablePath } from '@ankhorage/utility/node/path';

import type { ProjectDiagnostic } from '../../../../types/detection.js';
import type { ProjectInspectionOptions, ProjectSnapshot } from '../../../../types/inspection.js';
import { defaultExcludedDirectories, defaultManifestNames } from '../../constants/scanPolicy.js';
import { readManifestAsync } from './readManifestAsync.js';

/*** Collect bounded inspection evidence while pruning dependencies and never following directory symlinks. */
export async function readSnapshotAsync(
  rootPath: string,
  options: ProjectInspectionOptions,
): Promise<ProjectSnapshot> {
  const root = await realpath(rootPath);
  if (!(await stat(root)).isDirectory()) throw new Error('Inspection root must be a directory.');
  const limits = {
    maxDepth: options.maxDepth ?? 16,
    maxEntries: options.maxEntries ?? 20_000,
    maxManifestBytes: options.maxManifestBytes ?? 262_144,
    maxTotalManifestBytes: options.maxTotalManifestBytes ?? 8_388_608,
  };
  if (Object.values(limits).some((value) => !Number.isSafeInteger(value) || value < 1)) {
    throw new Error('Inspection limits must be positive safe integers.');
  }
  const state: ScanState = { count: 0, bytes: 0, files: [], contents: new Map(), diagnostics: [] };
  const context: ScanContext = {
    root,
    options,
    limits,
    state,
    excluded: new Set([...defaultExcludedDirectories, ...(options.excludeDirectories ?? [])]),
    manifests: new Set([...defaultManifestNames, ...(options.manifestNames ?? [])]),
  };
  await visitDirectoryAsync(root, 0, context);
  return {
    rootPath: root,
    files: [...state.files].sort(),
    contents: new Map([...state.contents].sort()),
    diagnostics: state.diagnostics,
    complete: state.diagnostics.length === 0,
  };
}

// Mutation is contained in the I/O adapter's scan budget/collectors to avoid quadratic copying
// of up to maxEntries results. No caller-owned state or core domain value is mutated.
interface ScanState {
  count: number;
  bytes: number;
  readonly files: string[];
  readonly contents: Map<string, string>;
  readonly diagnostics: ProjectDiagnostic[];
}

interface ScanContext {
  readonly root: string;
  readonly options: ProjectInspectionOptions;
  readonly limits: {
    readonly maxDepth: number;
    readonly maxEntries: number;
    readonly maxManifestBytes: number;
    readonly maxTotalManifestBytes: number;
  };
  readonly state: ScanState;
  readonly excluded: ReadonlySet<string>;
  readonly manifests: ReadonlySet<string>;
}

/*** Stream a directory with a global entry budget; return explicit diagnostics for partial scans. */
async function visitDirectoryAsync(
  directory: string,
  depth: number,
  context: ScanContext,
): Promise<void> {
  context.options.signal?.throwIfAborted();
  if (depth >= context.limits.maxDepth) {
    context.state.diagnostics.push({
      code: 'depth-limit',
      path: directory,
      message: 'Directory was not scanned because the depth limit was reached.',
    });
    return;
  }
  try {
    const handle = await opendir(directory);
    for await (const entry of handle) {
      context.options.signal?.throwIfAborted();
      if (context.state.count >= context.limits.maxEntries) {
        context.state.diagnostics.push({
          code: 'entry-limit',
          path: directory,
          message: 'Scan entry limit reached; inspection is incomplete.',
        });
        break;
      }
      context.state.count += 1;
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        context.state.diagnostics.push({
          code: 'symlink-skipped',
          path: file,
          message: 'Symbolic links are not followed.',
        });
      } else if (entry.isDirectory() && !context.excluded.has(entry.name)) {
        await visitDirectoryAsync(file, depth + 1, context);
      } else if (entry.isFile()) {
        await visitFileAsync(file, entry.name, context);
      }
    }
  } catch (error) {
    context.options.signal?.throwIfAborted();
    context.state.diagnostics.push({
      code: 'directory-unreadable',
      path: directory,
      message: toErrorMessage(error),
    });
  }
}

/*** Retain file paths and only read explicitly recognized manifest text. */
async function visitFileAsync(file: string, name: string, context: ScanContext): Promise<void> {
  const relative = toPortablePath(path.relative(context.root, file));
  context.state.files.push(relative);
  if (!context.manifests.has(name)) return;
  try {
    const remaining = context.limits.maxTotalManifestBytes - context.state.bytes;
    if (remaining <= 0) throw new Error('Total manifest byte budget reached.');
    const text = await readManifestAsync(
      file,
      context.root,
      Math.min(context.limits.maxManifestBytes, remaining),
    );
    context.state.bytes += Buffer.byteLength(text);
    context.state.contents.set(relative, text);
  } catch (error) {
    context.state.diagnostics.push({
      code: 'manifest-unreadable',
      path: relative,
      message: toErrorMessage(error),
    });
  }
}
import { toErrorMessage } from '@ankhorage/utility/error';
