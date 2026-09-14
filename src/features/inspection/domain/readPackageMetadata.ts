import { isRecord } from '@ankhorage/utility/object';

import type {
  ProjectDependencyMap,
  ProjectDetectionInput,
  ProjectDiagnostic,
} from '../../../types/detection.js';

/*** Validate inspected package JSON and report malformed metadata instead of executing project code. */
export function readPackageMetadata(
  text: string | undefined,
  path: string,
): {
  readonly input: ProjectDetectionInput;
  readonly manifest: Readonly<Record<string, unknown>>;
  readonly diagnostics: readonly ProjectDiagnostic[];
} {
  if (text === undefined) return { input: {}, manifest: {}, diagnostics: [] };
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value)) throw new Error('Expected a package.json object.');
    return {
      manifest: value,
      input: {
        dependencies: dependencyMap(value.dependencies),
        devDependencies: dependencyMap(value.devDependencies),
        peerDependencies: dependencyMap(value.peerDependencies),
        optionalDependencies: dependencyMap(value.optionalDependencies),
        ...(value.engines === undefined ? {} : { engines: dependencyMap(value.engines) }),
        ...(typeof value.packageManager === 'string'
          ? { packageManager: value.packageManager }
          : {}),
      },
      diagnostics: invalidFields(value).map((field) => ({
        code: 'invalid-package-field',
        path,
        message: `Invalid package metadata field: ${field}`,
      })),
    };
  } catch (error) {
    return {
      input: {},
      manifest: {},
      diagnostics: [
        {
          code: 'invalid-manifest',
          path,
          message: toErrorMessage(error),
        },
      ],
    };
  }
}

/*** Retain only valid dependency versions from one manifest section. */
function dependencyMap(value: unknown): ProjectDependencyMap {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([name, version]) =>
      typeof version === 'string' ? [[name, version]] : [],
    ),
  );
}

/*** List malformed known manifest fields so partial detection is visible. */
function invalidFields(value: Readonly<Record<string, unknown>>): readonly string[] {
  const maps = Object.entries(value).filter(([name]) =>
    [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
      'engines',
    ].includes(name),
  );
  return [
    ...maps
      .filter(
        ([, field]) =>
          !isRecord(field) || Object.values(field).some((item) => typeof item !== 'string'),
      )
      .map(([name]) => name),
    ...(value.packageManager !== undefined && typeof value.packageManager !== 'string'
      ? ['packageManager']
      : []),
  ];
}
import { toErrorMessage } from '@ankhorage/utility/error';
