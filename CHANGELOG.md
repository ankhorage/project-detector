# @ankhorage/project-detector

## 0.2.0

### Minor Changes

- b0b0e94: Expose the pruned inspected file paths on `ProjectInspection` so downstream analyzers can use the same source set as project detection.

## 0.1.1

### Patch Changes

- b73df21: Ignore generated `.ankh` materialization during project inspection so its shared runtime symlink does not make a source scan incomplete.

## 0.1.0

### Minor Changes

- 35ae4a0: Introduce extensible evidence-based project detection and bounded asynchronous filesystem inspection, consolidating the metadata and polyglot language detection used by Utility and pkgviz.
