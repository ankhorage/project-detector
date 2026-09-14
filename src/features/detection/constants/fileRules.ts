import type { DetectionFinding } from '../../../types/detection.js';

export const languageExtensions: ReadonlyMap<string, readonly string[]> = new Map([
  ['javascript', ['.js', '.jsx', '.mjs', '.cjs']],
  ['typescript', ['.ts', '.tsx', '.mts', '.cts']],
  ['java', ['.java']],
  ['kotlin', ['.kt', '.kts']],
  ['cpp', ['.cpp', '.cc', '.cxx', '.hpp', '.hxx']],
  ['python', ['.py', '.pyi']],
  ['delphi', ['.pas', '.pp', '.dpr', '.dproj', '.dfm', '.fmx', '.dpk', '.dcu']],
]);

export const manifestRules: readonly {
  readonly name: string;
  readonly kind: DetectionFinding['kind'];
  readonly value: string;
}[] = [
  { name: 'package.json', kind: 'language', value: 'javascript' },
  { name: 'pom.xml', kind: 'build-tool', value: 'maven' },
  { name: 'pom.xml', kind: 'language', value: 'java' },
  { name: 'build.gradle', kind: 'build-tool', value: 'gradle' },
  { name: 'build.gradle.kts', kind: 'build-tool', value: 'gradle' },
  { name: 'build.gradle.kts', kind: 'language', value: 'kotlin' },
  { name: 'settings.gradle.kts', kind: 'language', value: 'kotlin' },
  { name: 'mvnw', kind: 'build-tool', value: 'maven' },
  { name: 'mvnw.cmd', kind: 'build-tool', value: 'maven' },
  { name: 'CMakeLists.txt', kind: 'build-tool', value: 'cmake' },
  { name: 'Makefile', kind: 'build-tool', value: 'make' },
  { name: 'conanfile.txt', kind: 'package-manager', value: 'conan' },
  { name: 'conanfile.py', kind: 'package-manager', value: 'conan' },
  { name: 'vcpkg.json', kind: 'package-manager', value: 'vcpkg' },
  { name: 'requirements.txt', kind: 'language', value: 'python' },
  { name: 'requirements.txt', kind: 'package-manager', value: 'pip' },
  { name: 'setup.py', kind: 'language', value: 'python' },
  { name: 'setup.cfg', kind: 'language', value: 'python' },
  { name: 'pyproject.toml', kind: 'language', value: 'python' },
  { name: 'Pipfile', kind: 'package-manager', value: 'pipenv' },
  { name: 'Pipfile', kind: 'language', value: 'python' },
  { name: 'Pipfile.lock', kind: 'package-manager', value: 'pipenv' },
  { name: 'Pipfile.lock', kind: 'language', value: 'python' },
  { name: 'poetry.lock', kind: 'package-manager', value: 'poetry' },
  { name: 'poetry.lock', kind: 'language', value: 'python' },
  { name: 'uv.lock', kind: 'package-manager', value: 'uv' },
  { name: 'uv.lock', kind: 'language', value: 'python' },
  { name: 'package-lock.json', kind: 'package-manager', value: 'npm' },
  { name: 'npm-shrinkwrap.json', kind: 'package-manager', value: 'npm' },
  { name: 'yarn.lock', kind: 'package-manager', value: 'yarn' },
  { name: 'pnpm-lock.yaml', kind: 'package-manager', value: 'pnpm' },
  { name: 'pnpm-workspace.yaml', kind: 'package-manager', value: 'pnpm' },
  { name: 'bun.lock', kind: 'package-manager', value: 'bun' },
  { name: 'bun.lockb', kind: 'package-manager', value: 'bun' },
];

export const sourceRootNames = ['src/main/java', 'src/main/kotlin', 'src', 'app', 'Source'];
