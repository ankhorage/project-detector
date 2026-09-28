import type { ProjectDiagnostic } from '../../../types/detection.js';

/*** Distinguish scan failures from warnings about intentionally omitted evidence. */
export function hasBlockingDiagnostics(diagnostics: readonly ProjectDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity !== 'warning');
}
