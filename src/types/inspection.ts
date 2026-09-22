import type { ProjectDetection, ProjectDetectionOptions, ProjectDiagnostic } from './detection.js';

export interface ProjectInspectionOptions extends ProjectDetectionOptions {
  readonly maxDepth?: number;
  readonly maxEntries?: number;
  readonly maxManifestBytes?: number;
  readonly maxTotalManifestBytes?: number;
  /** Additional directory basenames to prune, not glob expressions. */
  readonly excludeDirectories?: readonly string[];
  /** Additional project-relative POSIX glob patterns for files to prune before detection. */
  readonly excludeFiles?: readonly string[];
  /** Additional manifest basenames whose bounded text is available to detectors. */
  readonly manifestNames?: readonly string[];
  readonly signal?: AbortSignal;
}

export interface ProjectSnapshot {
  readonly rootPath: string;
  readonly directories: readonly string[];
  readonly files: readonly string[];
  readonly contents: ReadonlyMap<string, string>;
  readonly diagnostics: readonly ProjectDiagnostic[];
  readonly complete: boolean;
}

export interface ProjectInspectionPort {
  readonly readAsync: (path: string, options: ProjectInspectionOptions) => Promise<ProjectSnapshot>;
}

export interface InspectedPackage {
  readonly rootPath: string;
  readonly manifestPath: string;
  readonly name?: string;
  readonly detection: ProjectDetection;
}

export interface InspectedWorkspace {
  readonly rootPath: string;
  readonly manifestPath: string;
  readonly patterns: readonly string[];
  readonly packagePaths: readonly string[];
}

export interface ProjectInspection {
  readonly rootPath: string;
  readonly complete: boolean;
  /** Sorted relative POSIX paths of scanned directories, including empty directories. */
  readonly directories: readonly string[];
  /** Sorted relative POSIX file paths retained by the configured inspection scan. */
  readonly files: readonly string[];
  readonly detection: ProjectDetection;
  readonly packages: readonly InspectedPackage[];
  readonly workspaces: readonly InspectedWorkspace[];
  readonly manifests: readonly string[];
  readonly diagnostics: readonly ProjectDiagnostic[];
}
