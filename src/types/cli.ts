export interface ProjectDetectorCliContext {
  readonly cwd: string;
  readonly writeStdout: (text: string) => void;
  readonly writeStderr: (text: string) => void;
}
