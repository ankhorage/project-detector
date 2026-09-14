import type {
  AttributedFinding,
  ProjectDetection,
  ProjectDetectionInput,
  ProjectDetectionOptions,
  ProjectDetector,
} from '../../../types/detection.js';
import { detectFiles } from '../domain/detectFiles.js';
import { detectMetadata } from '../domain/detectMetadata.js';
import { summarizeDetection } from '../domain/summarizeDetection.js';

/***
 * Detect overlapping project languages, frameworks, runtimes and package-manager evidence.
 *
 * The pure API accepts package metadata plus optional relative POSIX file paths and manifest text.
 * JavaScript, TypeScript, Java, Kotlin, C++, Python and Delphi evidence is additive, never exclusive.
 * Generic Make/CMake/Gradle files identify build tools, not necessarily a source language.
 * Scores are heuristic strengths, not confidence probabilities. No source parser, registry request,
 * dependency update, migration, filesystem operation or inspected project script runs here.
 * Extend detection with explicitly supplied trusted detector callbacks; IDs must be unique.
 * Public types are owned by this package and exported through `@ankhorage/project-detector/types`.
 * @readme
 */
export function detectProject(
  input: ProjectDetectionInput,
  options: ProjectDetectionOptions = {},
): ProjectDetection {
  const files = [...new Set(input.files ?? [])].sort();
  if (
    files.some(
      (file) =>
        file.length === 0 ||
        file.startsWith('/') ||
        /^[a-z]:/iu.test(file) ||
        file.includes('\\') ||
        file.split('/').includes('..'),
    )
  ) {
    throw new Error('Detection file paths must be relative POSIX paths without parent traversal.');
  }
  const detectors: readonly ProjectDetector[] = [
    { id: 'package-metadata', detect: detectMetadata },
    { id: 'file-evidence', detect: detectFiles },
    ...(options.detectors ?? []),
  ];
  if (
    detectors.some((detector) => detector.id.trim() === '') ||
    new Set(detectors.map((detector) => detector.id)).size !== detectors.length
  ) {
    throw new Error('Detector IDs must be non-empty and unique.');
  }
  const normalized = { ...input, files };
  const findings = detectors.flatMap((detector) => runDetector(detector, normalized));
  return summarizeDetection(findings, files);
}

/*** Attribute and validate contributions at the plugin boundary. */
function runDetector(
  detector: ProjectDetector,
  input: ProjectDetectionInput,
): readonly AttributedFinding[] {
  return detector.detect(input).map((finding) => {
    if (
      !Number.isFinite(finding.weight) ||
      finding.weight <= 0 ||
      finding.value.trim() === '' ||
      finding.evidence.trim() === ''
    ) {
      throw new Error(`Detector ${detector.id} returned an invalid finding.`);
    }
    return { ...finding, detectorId: detector.id };
  });
}
