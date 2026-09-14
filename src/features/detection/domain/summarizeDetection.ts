import type {
  AttributedFinding,
  DetectedLanguage,
  ProjectDetection,
  ProjectDiagnostic,
} from '../../../types/detection.js';
import { sourceRootNames } from '../constants/fileRules.js';

/*** Aggregate additive findings and preserve ties and ambiguity instead of choosing a language. */
export function summarizeDetection(
  findings: readonly AttributedFinding[],
  files: readonly string[],
): ProjectDetection {
  const languageIds = valuesFor(findings, 'language');
  const packageManagers = valuesFor(findings, 'package-manager');
  return {
    traits: new Set(
      findings
        .filter((finding) => ['language', 'framework', 'runtime'].includes(finding.kind))
        .map((finding) => finding.value),
    ),
    languages: languageIds.map((id) => summarizeLanguage(id, findings, files)),
    packageManagers,
    buildTools: valuesFor(findings, 'build-tool'),
    findings,
    diagnostics: detectionDiagnostics(findings, packageManagers),
  };
}

/*** Group language evidence without allowing duplicate findings to inflate the score. */
function summarizeLanguage(
  id: string,
  findings: readonly AttributedFinding[],
  files: readonly string[],
): DetectedLanguage {
  const languageFindings = findings.filter(
    (finding) => finding.kind === 'language' && finding.value === id,
  );
  const evidence = [...new Set(languageFindings.map((finding) => finding.evidence))].sort();
  const score = languageFindings.reduce((max, finding) => Math.max(max, finding.weight), 0);
  const languageFiles = new Set(evidence);
  const sourceRoots = sourceRootNames.filter((root) =>
    files.some((file) => languageFiles.has(file) && file.startsWith(`${root}/`)),
  );
  return { id, evidence, score, sourceRoots: sourceRoots.length > 0 ? sourceRoots : ['.'] };
}

/*** Return deterministic unique values for one kind of evidence. */
function valuesFor(
  findings: readonly AttributedFinding[],
  kind: AttributedFinding['kind'],
): readonly string[] {
  return [
    ...new Set(findings.filter((finding) => finding.kind === kind).map((finding) => finding.value)),
  ].sort();
}

/*** Report missing evidence and conflicting JavaScript package-manager signals. */
function detectionDiagnostics(
  findings: readonly AttributedFinding[],
  managers: readonly string[],
): readonly ProjectDiagnostic[] {
  const nodeManagers = managers.filter((manager) =>
    ['npm', 'pnpm', 'yarn', 'bun'].includes(manager),
  );
  return [
    ...(findings.length === 0
      ? [{ code: 'unknown-project', message: 'No supported project indicators found.' }]
      : []),
    ...(nodeManagers.length > 1
      ? [
          {
            code: 'ambiguous-package-manager',
            message: `Multiple package managers detected: ${nodeManagers.join(', ')}. Select explicitly before updates.`,
          },
        ]
      : []),
  ];
}
