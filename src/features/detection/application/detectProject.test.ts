import { expect, test } from 'bun:test';

import { detectProject } from '../../../projectDetector.js';
import type { ProjectDetectionInput, ProjectDetector } from '../../../types/public.js';

test.each([
  [{}, []],
  [{ devDependencies: { typescript: '*' } }, ['javascript', 'typescript']],
  [{ peerDependencies: { react: '*' } }, ['javascript', 'react']],
  [{ dependencies: { next: '*' } }, ['javascript', 'next', 'node', 'react']],
  [{ dependencies: { 'react-native': '*' } }, ['javascript', 'react', 'react-native']],
  [{ dependencies: { expo: '*' } }, ['expo', 'javascript', 'react', 'react-native']],
  [{ engines: { node: '*' }, packageManager: 'bun@*' }, ['bun', 'javascript', 'node']],
] satisfies readonly (readonly [ProjectDetectionInput, readonly string[]])[])(
  'preserves metadata traits for %j',
  (input, expected) => {
    expect([...detectProject(input).traits].sort()).toEqual(expected);
  },
);

test.each([
  ['javascript', 'src/app.js'],
  ['javascript', 'src/app.mjs'],
  ['typescript', 'src/app.tsx'],
  ['typescript', 'tsconfig.build.json'],
  ['java', 'src/main/java/Main.java'],
  ['kotlin', 'src/main/kotlin/Main.kt'],
  ['cpp', 'src/main.cpp'],
  ['python', 'app/main.py'],
  ['python', 'Pipfile'],
  ['python', 'poetry.lock'],
  ['delphi', 'Source/Unit.pas'],
  ['delphi', 'Project.dproj'],
])('detects %s from %s', (language, file) => {
  expect(detectProject({ files: [file] }).traits.has(language)).toBe(true);
});

test('preserves simultaneous languages and language-specific source-root evidence', () => {
  const result = detectProject({
    files: ['src/main/java/App.java', 'src/main/kotlin/App.kt', 'web/index.ts', 'script.py'],
  });
  expect(result.languages.map((language) => language.id)).toEqual([
    'java',
    'kotlin',
    'python',
    'typescript',
  ]);
  expect(result.languages.find((language) => language.id === 'kotlin')?.sourceRoots).toEqual([
    'src/main/kotlin',
    'src',
  ]);
});

test('does not claim generic build files prove C++ or Java', () => {
  const result = detectProject({ files: ['Makefile', 'CMakeLists.txt', 'build.gradle'] });
  expect(result.buildTools).toEqual(['cmake', 'gradle', 'make']);
  expect(result.languages).toEqual([]);
});

test('reads Kotlin plugin evidence without executing Gradle or Maven', () => {
  const result = detectProject({
    files: ['pom.xml', 'build.gradle'],
    contents: new Map([
      ['pom.xml', '<artifactId>kotlin-maven-plugin</artifactId>'],
      ['build.gradle', 'plugins { id "org.jetbrains.kotlin.jvm" }'],
    ]),
  });
  expect(result.traits.has('kotlin')).toBe(true);
});

test('finds nested Conan and vcpkg metadata and package-manager conflicts', () => {
  const result = detectProject({
    packageManager: 'pnpm@*',
    files: ['native/conanfile.txt', 'native/vcpkg.json', 'yarn.lock'],
  });
  expect(result.packageManagers).toEqual(['conan', 'pnpm', 'vcpkg', 'yarn']);
  expect(result.diagnostics.some((item) => item.code === 'ambiguous-package-manager')).toBe(true);
});

test('adds new ecosystems without changing built-in implementations', () => {
  const detector: ProjectDetector = {
    id: 'rust',
    detect: (input) =>
      input.files?.includes('Cargo.toml')
        ? [{ kind: 'language', value: 'rust', evidence: 'Cargo.toml', weight: 3 }]
        : [],
  };
  const result = detectProject({ files: ['Cargo.toml', 'src/app.ts'] }, { detectors: [detector] });
  expect(result.traits.has('rust')).toBe(true);
  expect(result.traits.has('typescript')).toBe(true);
  expect(result.findings.some((finding) => finding.detectorId === 'rust')).toBe(true);
});

test('rejects conflicting extension IDs and invalid weights', () => {
  expect(() =>
    detectProject({}, { detectors: [{ id: 'file-evidence', detect: () => [] }] }),
  ).toThrow('unique');
  expect(() =>
    detectProject(
      {},
      {
        detectors: [
          {
            id: 'invalid',
            detect: () => [{ kind: 'language', value: 'x', evidence: 'x', weight: NaN }],
          },
        ],
      },
    ),
  ).toThrow('invalid finding');
});

test('reports unknown input and rejects non-portable paths', () => {
  expect(detectProject({}).diagnostics[0]?.code).toBe('unknown-project');
  for (const file of ['../escape.ts', '/root.ts', 'C:\\root.ts']) {
    expect(() => detectProject({ files: [file] })).toThrow('relative POSIX');
  }
});

test('does not mutate or multiply duplicate input evidence', () => {
  const input = Object.freeze({ files: Object.freeze(['src/a.ts', 'src/a.ts']) });
  const result = detectProject(input);
  expect(result.languages[0]?.evidence).toEqual(['src/a.ts']);
  expect(input.files.length).toBe(2);
});
