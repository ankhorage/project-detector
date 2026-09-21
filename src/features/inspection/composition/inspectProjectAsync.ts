import type { ProjectInspection, ProjectInspectionOptions } from '../../../types/inspection.js';
import { readSnapshotAsync } from '../adapters/outbound/readSnapshotAsync.js';
import { inspectWithPortAsync } from '../application/inspectWithPortAsync.js';

/***
 * Inspect a directory using bounded, asynchronous, read-only filesystem access.
 *
 * Import from `@ankhorage/project-detector/node`. Defaults: depth 16, 20,000 entries,
 * 256 KiB per manifest and 8 MiB total manifest text. Dependency/build/cache directories,
 * including generated `.ankh`, are pruned. Symlinks outside exclusions are skipped
 * with diagnostics; their targets are never intentionally scanned. Pass an AbortSignal to cancel.
 * Configure additional manifest basenames and detector callbacks for new ecosystems.
 * Package/workspace membership currently resolves JavaScript package.json workspaces and pnpm YAML;
 * other ecosystem manifests are identified, not fully resolved into dependency graphs.
 * No inspected JavaScript, Gradle, Python, executable config or install script is executed.
 * Inspection is a best-effort snapshot, not a sandbox against concurrent hostile filesystem edits.
 * The result reports incompleteness; it never grants permission to run an update.
 * On a complete scan output is sorted; when a budget is exhausted the retained subset depends
 * on filesystem enumeration order. Inspect a stable checkout for reproducible results.
 * Install with `npm install @ankhorage/project-detector`; the standalone command is
 * `npx --package @ankhorage/project-detector project-detector inspect .`.
 * With Ankh installed, use `ankh project-detector inspect .`.
 * CLI exit codes are 0 for a complete scan, 1 for invocation/root errors and 2 for partial scans.
 * Release automation requires the organization release App configuration and npm publishing
 * authorization for this new package; repository files alone do not provision these credentials.
 * @readme
 */
export async function inspectProjectAsync(
  path: string,
  options: ProjectInspectionOptions = {},
): Promise<ProjectInspection> {
  return inspectWithPortAsync(path, { readAsync: readSnapshotAsync }, options);
}
