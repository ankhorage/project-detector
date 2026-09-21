# Public API

## AttributedFinding

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:44:1`

### Members

| Name       | Kind     | Type                                                                                        | Required | Description |
| ---------- | -------- | ------------------------------------------------------------------------------------------- | -------- | ----------- |
| detectorId | property | `string`                                                                                    | yes      |             |
| evidence   | property | `string`                                                                                    | yes      |             |
| kind       | property | `"language" \| "framework" \| "runtime" \| "package-manager" \| "build-tool" \| "manifest"` | yes      |             |
| value      | property | `string`                                                                                    | yes      |             |
| weight     | property | `number`                                                                                    | yes      |             |

## DetectedLanguage

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:48:1`

### Members

| Name        | Kind     | Type                | Required | Description |
| ----------- | -------- | ------------------- | -------- | ----------- |
| evidence    | property | `readonly string[]` | yes      |             |
| id          | property | `string`            | yes      |             |
| score       | property | `number`            | yes      |             |
| sourceRoots | property | `readonly string[]` | yes      |             |

## DetectionFinding

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:18:1`

### Members

| Name     | Kind     | Type                                                                                        | Required | Description |
| -------- | -------- | ------------------------------------------------------------------------------------------- | -------- | ----------- |
| evidence | property | `string`                                                                                    | yes      |             |
| kind     | property | `"language" \| "framework" \| "runtime" \| "package-manager" \| "build-tool" \| "manifest"` | yes      |             |
| value    | property | `string`                                                                                    | yes      |             |
| weight   | property | `number`                                                                                    | yes      |             |

## detectProject

Kind: `function`
Module: `src/features/detection/application/detectProject.ts`
Source: `src/features/detection/application/detectProject.ts:24:1`

Detect overlapping project languages, frameworks, runtimes and package-manager evidence.

The pure API accepts package metadata plus optional relative POSIX file paths and manifest text.
JavaScript, TypeScript, Java, Kotlin, C++, Python and Delphi evidence is additive, never exclusive.
Generic Make/CMake/Gradle files identify build tools, not necessarily a source language.
Scores are heuristic strengths, not confidence probabilities. No source parser, registry request,
dependency update, migration, filesystem operation or inspected project script runs here.
Extend detection with explicitly supplied trusted detector callbacks; IDs must be unique.
Public types are owned by this package and exported through `@ankhorage/project-detector/types`.

### Signatures

- `(input: ProjectDetectionInput, options?: ProjectDetectionOptions) => ProjectDetection`
  - input: `ProjectDetectionInput`
  - options: `ProjectDetectionOptions` (optional)
  - returns: `ProjectDetection`

## InspectedPackage

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:28:1`

### Members

| Name         | Kind     | Type               | Required | Description |
| ------------ | -------- | ------------------ | -------- | ----------- |
| detection    | property | `ProjectDetection` | yes      |             |
| manifestPath | property | `string`           | yes      |             |
| name         | property | `string`           | no       |             |
| rootPath     | property | `string`           | yes      |             |

## InspectedWorkspace

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:35:1`

### Members

| Name         | Kind     | Type                | Required | Description |
| ------------ | -------- | ------------------- | -------- | ----------- |
| manifestPath | property | `string`            | yes      |             |
| packagePaths | property | `readonly string[]` | yes      |             |
| patterns     | property | `readonly string[]` | yes      |             |
| rootPath     | property | `string`            | yes      |             |

## inspectProjectAsync

Kind: `function`
Module: `src/features/inspection/composition/inspectProjectAsync.ts`
Source: `src/features/inspection/composition/inspectProjectAsync.ts:30:1`

Inspect a directory using bounded, asynchronous, read-only filesystem access.

Import from `@ankhorage/project-detector/node`. Defaults: depth 16, 20,000 entries,
256 KiB per manifest and 8 MiB total manifest text. Dependency/build/cache directories,
including generated `.ankh`, are pruned. Symlinks outside exclusions are skipped
with diagnostics; their targets are never intentionally scanned. Pass an AbortSignal to cancel.
Configure additional manifest basenames and detector callbacks for new ecosystems.
Package/workspace membership currently resolves JavaScript package.json workspaces and pnpm YAML;
other ecosystem manifests are identified, not fully resolved into dependency graphs.
No inspected JavaScript, Gradle, Python, executable config or install script is executed.
Inspection is a best-effort snapshot, not a sandbox against concurrent hostile filesystem edits.
Returned `directories` and `files` are sorted relative POSIX paths from the pruned scan.
The directory inventory includes empty directories and omits the inspection root itself.
The result reports incompleteness; it never grants permission to run an update.
On a complete scan output is sorted; when a budget is exhausted the retained subset depends
on filesystem enumeration order. Inspect a stable checkout for reproducible results.
Install with `npm install @ankhorage/project-detector`; the standalone command is
`npx --package @ankhorage/project-detector project-detector inspect .`.
With Ankh installed, use `ankh project-detector inspect .`.
CLI exit codes are 0 for a complete scan, 1 for invocation/root errors and 2 for partial scans.
Release automation requires the organization release App configuration and npm publishing
authorization for this new package; repository files alone do not provision these credentials.

### Signatures

- `(path: string, options?: ProjectInspectionOptions) => Promise<ProjectInspection>`
  - options: `ProjectInspectionOptions` (optional)
  - path: `string`
  - returns: `Promise<ProjectInspection>`

## inspectWithPortAsync

Kind: `function`
Module: `src/features/inspection/application/inspectWithPortAsync.ts`
Source: `src/features/inspection/application/inspectWithPortAsync.ts:19:1`

Inspect a snapshot through an injected evidence source; keep I/O outside project classification.

### Signatures

- `(path: string, port: ProjectInspectionPort, options?: ProjectInspectionOptions) => Promise<ProjectInspection>`
  - options: `ProjectInspectionOptions` (optional)
  - path: `string`
  - port: `ProjectInspectionPort`
  - returns: `Promise<ProjectInspection>`

## ProjectDependencyMap

Kind: `unknown`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:1:1`

## ProjectDetection

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:55:1`

### Members

| Name            | Kind     | Type                           | Required | Description |
| --------------- | -------- | ------------------------------ | -------- | ----------- |
| buildTools      | property | `readonly string[]`            | yes      |             |
| diagnostics     | property | `readonly ProjectDiagnostic[]` | yes      |             |
| findings        | property | `readonly AttributedFinding[]` | yes      |             |
| languages       | property | `readonly DetectedLanguage[]`  | yes      |             |
| packageManagers | property | `readonly string[]`            | yes      |             |
| traits          | property | `ReadonlySet<string>`          | yes      |             |

## ProjectDetectionInput

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:5:1`

### Members

| Name                 | Kind     | Type                               | Required | Description |
| -------------------- | -------- | ---------------------------------- | -------- | ----------- |
| contents             | property | `ReadonlyMap<string, string>`      | no       |             |
| dependencies         | property | `Readonly<Record<string, string>>` | no       |             |
| devDependencies      | property | `Readonly<Record<string, string>>` | no       |             |
| engines              | property | `Readonly<Record<string, string>>` | no       |             |
| files                | property | `readonly string[]`                | no       |             |
| optionalDependencies | property | `Readonly<Record<string, string>>` | no       |             |
| packageManager       | property | `string`                           | no       |             |
| peerDependencies     | property | `Readonly<Record<string, string>>` | no       |             |

## ProjectDetectionOptions

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:33:1`

### Members

| Name      | Kind     | Type                         | Required | Description |
| --------- | -------- | ---------------------------- | -------- | ----------- |
| detectors | property | `readonly ProjectDetector[]` | no       |             |

## ProjectDetector

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:27:1`

### Members

| Name   | Kind     | Type                                                            | Required | Description |
| ------ | -------- | --------------------------------------------------------------- | -------- | ----------- |
| detect | property | `(input: ProjectDetectionInput) => readonly DetectionFinding[]` | yes      |             |
| id     | property | `string`                                                        | yes      |             |

## ProjectDetectorCliContext

Kind: `type`
Module: `src/types/cli.ts`
Source: `src/types/cli.ts:1:1`

### Members

| Name        | Kind     | Type                     | Required | Description |
| ----------- | -------- | ------------------------ | -------- | ----------- |
| cwd         | property | `string`                 | yes      |             |
| writeStderr | property | `(text: string) => void` | yes      |             |
| writeStdout | property | `(text: string) => void` | yes      |             |

## ProjectDiagnostic

Kind: `type`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:38:1`

### Members

| Name    | Kind     | Type     | Required | Description |
| ------- | -------- | -------- | -------- | ----------- |
| code    | property | `string` | yes      |             |
| message | property | `string` | yes      |             |
| path    | property | `string` | no       |             |

## ProjectInspection

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:42:1`

### Members

| Name        | Kind     | Type                            | Required | Description |
| ----------- | -------- | ------------------------------- | -------- | ----------- |
| complete    | property | `boolean`                       | yes      |             |
| detection   | property | `ProjectDetection`              | yes      |             |
| diagnostics | property | `readonly ProjectDiagnostic[]`  | yes      |             |
| directories | property | `readonly string[]`             | yes      |             |
| files       | property | `readonly string[]`             | yes      |             |
| manifests   | property | `readonly string[]`             | yes      |             |
| packages    | property | `readonly InspectedPackage[]`   | yes      |             |
| rootPath    | property | `string`                        | yes      |             |
| workspaces  | property | `readonly InspectedWorkspace[]` | yes      |             |

## ProjectInspectionOptions

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:3:1`

### Members

| Name                  | Kind     | Type                         | Required | Description |
| --------------------- | -------- | ---------------------------- | -------- | ----------- |
| detectors             | property | `readonly ProjectDetector[]` | no       |             |
| excludeDirectories    | property | `readonly string[]`          | no       |             |
| manifestNames         | property | `readonly string[]`          | no       |             |
| maxDepth              | property | `number`                     | no       |             |
| maxEntries            | property | `number`                     | no       |             |
| maxManifestBytes      | property | `number`                     | no       |             |
| maxTotalManifestBytes | property | `number`                     | no       |             |
| signal                | property | `AbortSignal`                | no       |             |

## ProjectInspectionPort

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:24:1`

### Members

| Name      | Kind     | Type                                                                            | Required | Description |
| --------- | -------- | ------------------------------------------------------------------------------- | -------- | ----------- |
| readAsync | property | `(path: string, options: ProjectInspectionOptions) => Promise<ProjectSnapshot>` | yes      |             |

## ProjectSnapshot

Kind: `type`
Module: `src/types/inspection.ts`
Source: `src/types/inspection.ts:15:1`

### Members

| Name        | Kind     | Type                           | Required | Description |
| ----------- | -------- | ------------------------------ | -------- | ----------- |
| complete    | property | `boolean`                      | yes      |             |
| contents    | property | `ReadonlyMap<string, string>`  | yes      |             |
| diagnostics | property | `readonly ProjectDiagnostic[]` | yes      |             |
| directories | property | `readonly string[]`            | yes      |             |
| files       | property | `readonly string[]`            | yes      |             |
| rootPath    | property | `string`                       | yes      |             |

## ProjectTrait

Kind: `unknown`
Module: `src/types/detection.ts`
Source: `src/types/detection.ts:3:1`
