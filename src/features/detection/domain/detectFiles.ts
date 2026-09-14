import type { DetectionFinding, ProjectDetectionInput } from '../../../types/detection.js';
import { languageExtensions, manifestRules } from '../constants/fileRules.js';

/*** Classify file and manifest evidence without loading or executing a project. */
export function detectFiles(input: ProjectDetectionInput): readonly DetectionFinding[] {
  return (input.files ?? []).flatMap((file) => [
    ...detectFileName(file),
    ...detectContent(file, input.contents?.get(file)),
  ]);
}

/*** Interpret file basenames and language-specific suffixes. */
function detectFileName(file: string): readonly DetectionFinding[] {
  const name = file.split('/').at(-1) ?? file;
  return [
    ...[...languageExtensions]
      .filter(([, extensions]) => extensions.some((extension) => name.endsWith(extension)))
      .map(([value]) => ({ kind: 'language' as const, value, evidence: file, weight: 3 })),
    ...manifestRules
      .filter((rule) => rule.name === name)
      .map((rule) => ({ kind: rule.kind, value: rule.value, evidence: file, weight: 1 })),
    ...(name.startsWith('tsconfig') && name.endsWith('.json')
      ? [{ kind: 'language' as const, value: 'typescript', evidence: file, weight: 3 }]
      : []),
    ...(isManifest(name)
      ? [{ kind: 'manifest' as const, value: name, evidence: file, weight: 1 }]
      : []),
  ];
}

/*** Distinguish Kotlin build plugins from generic JVM build files. */
function detectContent(file: string, content: string | undefined): readonly DetectionFinding[] {
  const name = file.split('/').at(-1);
  if (content === undefined || (name !== 'pom.xml' && name !== 'build.gradle')) return [];
  const kotlin =
    content.includes('org.jetbrains.kotlin') ||
    content.includes('kotlin-maven-plugin') ||
    content.includes('kotlin-stdlib') ||
    content.includes('kotlin');
  return kotlin
    ? [{ kind: 'language', value: 'kotlin', evidence: `${file}:kotlin-plugin`, weight: 3 }]
    : [];
}

/*** Identify manifests independently from inferred language certainty. */
function isManifest(name: string): boolean {
  return (
    manifestRules.some((rule) => rule.name === name) ||
    name === 'ankh.config.json' ||
    name.endsWith('.dproj')
  );
}
