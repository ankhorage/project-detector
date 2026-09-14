export type ProjectDependencyMap = Readonly<Record<string, string>>;

export type ProjectTrait = string;

export interface ProjectDetectionInput {
  readonly dependencies?: ProjectDependencyMap;
  readonly devDependencies?: ProjectDependencyMap;
  readonly peerDependencies?: ProjectDependencyMap;
  readonly optionalDependencies?: ProjectDependencyMap;
  readonly engines?: Readonly<Record<string, string>>;
  readonly packageManager?: string;
  /** Relative POSIX file paths. No directories or dependency/build artifacts. */
  readonly files?: readonly string[];
  /** Optional bounded text of known manifests, keyed by relative POSIX path. */
  readonly contents?: ReadonlyMap<string, string>;
}

export interface DetectionFinding {
  readonly kind:
    'language' | 'framework' | 'runtime' | 'package-manager' | 'build-tool' | 'manifest';
  readonly value: string;
  readonly evidence: string;
  /** Relative heuristic strength, not a probability. */
  readonly weight: number;
}

export interface ProjectDetector {
  readonly id: string;
  /** Caller-supplied code is trusted; inspected project code is never loaded. */
  readonly detect: (input: ProjectDetectionInput) => readonly DetectionFinding[];
}

export interface ProjectDetectionOptions {
  /** Additions to built-ins; duplicate detector IDs are rejected. */
  readonly detectors?: readonly ProjectDetector[];
}

export interface ProjectDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface AttributedFinding extends DetectionFinding {
  readonly detectorId: string;
}

export interface DetectedLanguage {
  readonly id: string;
  readonly score: number;
  readonly evidence: readonly string[];
  readonly sourceRoots: readonly string[];
}

export interface ProjectDetection {
  readonly traits: ReadonlySet<ProjectTrait>;
  readonly languages: readonly DetectedLanguage[];
  readonly packageManagers: readonly string[];
  readonly buildTools: readonly string[];
  readonly findings: readonly AttributedFinding[];
  readonly diagnostics: readonly ProjectDiagnostic[];
}
