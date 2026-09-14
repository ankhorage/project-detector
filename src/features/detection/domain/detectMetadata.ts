import type { DetectionFinding, ProjectDetectionInput } from '../../../types/detection.js';

/*** Infer overlapping JavaScript ecosystem traits from explicit package metadata. */
export function detectMetadata(input: ProjectDetectionInput): readonly DetectionFinding[] {
  const dependencies = new Set([
    ...Object.keys(input.dependencies ?? {}),
    ...Object.keys(input.devDependencies ?? {}),
    ...Object.keys(input.peerDependencies ?? {}),
    ...Object.keys(input.optionalDependencies ?? {}),
  ]);
  const dependencySignals = [...dependencies].flatMap((name) =>
    dependencyRules
      .filter((rule) => rule.dependency === name)
      .map((rule) => ({
        kind: rule.kind,
        value: rule.value,
        evidence: `dependency:${name}`,
        weight: 3,
      })),
  );
  const hasManifest =
    dependencies.size > 0 || input.engines !== undefined || input.packageManager !== undefined;
  return [
    ...(hasManifest ? [finding('language', 'javascript', 'package metadata')] : []),
    ...dependencySignals,
    ...Object.keys(input.engines ?? {})
      .filter((name) => name === 'node' || name === 'bun')
      .map((name) => finding('runtime', name, `engines:${name}`)),
    ...detectManager(input.packageManager),
  ];
}

const dependencyRules: readonly {
  readonly dependency: string;
  readonly kind: DetectionFinding['kind'];
  readonly value: string;
}[] = [
  { dependency: 'typescript', kind: 'language', value: 'typescript' },
  { dependency: 'react', kind: 'framework', value: 'react' },
  { dependency: 'react-native', kind: 'framework', value: 'react-native' },
  { dependency: 'react-native', kind: 'framework', value: 'react' },
  { dependency: 'expo', kind: 'framework', value: 'expo' },
  { dependency: 'expo', kind: 'framework', value: 'react-native' },
  { dependency: 'expo', kind: 'framework', value: 'react' },
  { dependency: 'next', kind: 'framework', value: 'next' },
  { dependency: 'next', kind: 'framework', value: 'react' },
  { dependency: 'next', kind: 'runtime', value: 'node' },
  { dependency: '@types/node', kind: 'runtime', value: 'node' },
  { dependency: '@types/bun', kind: 'runtime', value: 'bun' },
];

/*** Record one package metadata signal without treating its weight as confidence. */
function finding(
  kind: DetectionFinding['kind'],
  value: string,
  evidence: string,
): DetectionFinding {
  return { kind, value, evidence, weight: 1 };
}

/*** Recognize an explicitly declared package manager and its Bun runtime implication. */
function detectManager(value: string | undefined): readonly DetectionFinding[] {
  if (value === undefined) return [];
  const manager = ['npm', 'pnpm', 'yarn', 'bun'].find((name) => value.startsWith(`${name}@`));
  if (manager === undefined) return [];
  return [
    finding('package-manager', manager, `packageManager:${value}`),
    ...(manager === 'bun' ? [finding('runtime', 'bun', `packageManager:${value}`)] : []),
  ];
}
