import { isStringArray } from '@ankhorage/utility/array';
import { isRecord } from '@ankhorage/utility/object';
import { minimatch } from 'minimatch';
import { parseDocument } from 'yaml';

import type { ProjectDiagnostic } from '../../../types/detection.js';
import type { InspectedWorkspace, ProjectSnapshot } from '../../../types/inspection.js';
import { readPackageMetadata } from './readPackageMetadata.js';

/*** Resolve declared JavaScript workspace membership without guessing from folder names. */
export function inspectWorkspaces(snapshot: ProjectSnapshot): {
  readonly workspaces: readonly InspectedWorkspace[];
  readonly diagnostics: readonly ProjectDiagnostic[];
} {
  const manifests = snapshot.files.filter(
    (file) => file.endsWith('/package.json') || file === 'package.json',
  );
  const results = [...snapshot.contents]
    .filter(([file]) => file.endsWith('package.json') || file.endsWith('pnpm-workspace.yaml'))
    .map(([file, text]) => workspaceFromManifest(file, text, manifests));
  return {
    workspaces: results.flatMap((result) => result.workspaces),
    diagnostics: results.flatMap((result) => result.diagnostics),
  };
}

/*** Parse one declarative workspace definition with explicit malformed-input diagnostics. */
function workspaceFromManifest(
  file: string,
  text: string,
  packages: readonly string[],
): {
  readonly workspaces: readonly InspectedWorkspace[];
  readonly diagnostics: readonly ProjectDiagnostic[];
} {
  try {
    const patterns = readPatterns(file, text);
    if (patterns === undefined) return { workspaces: [], diagnostics: [] };
    const prefix = file.slice(0, file.lastIndexOf('/') + 1);
    const roots = packages
      .filter((manifest) => manifest.startsWith(prefix) && manifest !== `${prefix}package.json`)
      .map((manifest) => manifest.slice(prefix.length, -'/package.json'.length));
    const included = patterns.filter((pattern) => !pattern.startsWith('!'));
    const excluded = patterns
      .filter((pattern) => pattern.startsWith('!'))
      .map((pattern) => pattern.slice(1));
    const members = roots.filter(
      (root) =>
        included.some((pattern) => minimatch(root, pattern, { dot: true })) &&
        !excluded.some((pattern) => minimatch(root, pattern, { dot: true })),
    );
    return {
      workspaces: [
        {
          rootPath: prefix.slice(0, -1) || '.',
          manifestPath: file,
          patterns,
          packagePaths: members.map((root) => `${prefix}${root}`).sort(),
        },
      ],
      diagnostics: [],
    };
  } catch (error) {
    return {
      workspaces: [],
      diagnostics: [
        {
          code: 'invalid-workspace',
          path: file,
          message: toErrorMessage(error),
        },
      ],
    };
  }
}

/*** Read npm/Yarn workspace arrays or pnpm YAML without evaluating configuration scripts. */
function readPatterns(file: string, text: string): readonly string[] | undefined {
  if (file.endsWith('pnpm-workspace.yaml')) {
    const document = parseDocument(text, { uniqueKeys: true });
    if (document.errors.length > 0) throw new Error('Invalid pnpm workspace YAML.');
    const parsed: unknown = document.toJS({ maxAliasCount: 50 });
    if (!isRecord(parsed) || !isStringArray(parsed.packages))
      throw new Error('Expected a packages array in pnpm-workspace.yaml.');
    return parsed.packages;
  }
  const { manifest } = readPackageMetadata(text, file);
  if (manifest.workspaces === undefined) return undefined;
  const patterns = isRecord(manifest.workspaces)
    ? manifest.workspaces.packages
    : manifest.workspaces;
  if (!isStringArray(patterns)) throw new Error('Expected a workspace pattern array.');
  return patterns;
}
import { toErrorMessage } from '@ankhorage/utility/error';
