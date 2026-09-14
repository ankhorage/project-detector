import type {
  ProjectDetection,
  ProjectDetectionInput,
  ProjectDetectionOptions,
} from '../../../types/detection.js';
import type {
  InspectedPackage,
  ProjectInspection,
  ProjectInspectionOptions,
  ProjectInspectionPort,
  ProjectSnapshot,
} from '../../../types/inspection.js';
import { detectProject } from '../../detection/application/detectProject.js';
import { summarizeDetection } from '../../detection/domain/summarizeDetection.js';
import { inspectWorkspaces } from '../domain/inspectWorkspaces.js';
import { readPackageMetadata } from '../domain/readPackageMetadata.js';

/*** Inspect a snapshot through an injected evidence source; keep I/O outside project classification. */
export async function inspectWithPortAsync(
  path: string,
  port: ProjectInspectionPort,
  options: ProjectInspectionOptions = {},
): Promise<ProjectInspection> {
  const snapshot = await port.readAsync(path, options);
  const packages = snapshot.files.filter(
    (file) => file === 'package.json' || file.endsWith('/package.json'),
  );
  const metadata = packages.map((file) => readPackageMetadata(snapshot.contents.get(file), file));
  const workspace = inspectWorkspaces(snapshot);
  const inspected = packages.map((file) => inspectPackage(file, packages, snapshot, options));
  const detection = detectSnapshot(snapshot, inspected, options);
  const diagnostics = [
    ...snapshot.diagnostics,
    ...metadata.flatMap((item) => item.diagnostics),
    ...workspace.diagnostics,
  ];
  return {
    rootPath: snapshot.rootPath,
    complete: snapshot.complete && diagnostics.length === 0,
    detection,
    packages: inspected,
    workspaces: workspace.workspaces,
    manifests: [
      ...new Set([
        ...snapshot.contents.keys(),
        ...detection.findings
          .filter((finding) => finding.kind === 'manifest')
          .map((finding) => finding.evidence),
      ]),
    ].sort(),
    diagnostics: [...diagnostics, ...detection.diagnostics],
  };
}

/*** Combine tree evidence with attributed metadata from every package, not just the root. */
function detectSnapshot(
  snapshot: ProjectSnapshot,
  packages: readonly InspectedPackage[],
  options: ProjectDetectionOptions,
): ProjectDetection {
  const base = detectProject({ files: snapshot.files, contents: snapshot.contents }, options);
  const metadataFindings = packages.flatMap((item) =>
    item.detection.findings
      .filter((finding) => finding.detectorId === 'package-metadata')
      .map((finding) => ({ ...finding, evidence: `${item.manifestPath}:${finding.evidence}` })),
  );
  return summarizeDetection([...base.findings, ...metadataFindings], snapshot.files);
}

/*** Classify each package using its own metadata and files, excluding nested package roots. */
function inspectPackage(
  file: string,
  manifests: readonly string[],
  snapshot: ProjectSnapshot,
  options: ProjectDetectionOptions,
): InspectedPackage {
  const prefix = file.slice(0, file.lastIndexOf('/') + 1);
  const nested = manifests
    .filter((candidate) => candidate !== file && candidate.startsWith(prefix))
    .map((candidate) => candidate.slice(0, candidate.lastIndexOf('/') + 1));
  const owns = (candidate: string): boolean =>
    candidate.startsWith(prefix) && !nested.some((root) => candidate.startsWith(root));
  const metadata = readPackageMetadata(snapshot.contents.get(file), file);
  const input: ProjectDetectionInput = {
    ...metadata.input,
    files: snapshot.files.filter(owns).map((candidate) => candidate.slice(prefix.length)),
    contents: new Map(
      [...snapshot.contents]
        .filter(([candidate]) => owns(candidate))
        .map(([candidate, text]) => [candidate.slice(prefix.length), text]),
    ),
  };
  return {
    rootPath: prefix.slice(0, -1) || '.',
    manifestPath: file,
    ...(typeof metadata.manifest.name === 'string' ? { name: metadata.manifest.name } : {}),
    detection: detectProject(input, options),
  };
}
