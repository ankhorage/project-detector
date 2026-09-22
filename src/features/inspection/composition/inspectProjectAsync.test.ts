import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { inspectProjectAsync, inspectWithPortAsync } from '../../../nodeProjectDetector.js';

test('inspects package.json workspaces and isolates nested package traits', async () => {
  const fixture = await createFixtureAsync({
    'package.json': JSON.stringify({ name: 'root', workspaces: ['apps/*', '!apps/excluded'] }),
    'apps/mobile/package.json': JSON.stringify({ name: 'mobile', dependencies: { expo: '*' } }),
    'apps/mobile/src/App.tsx': '',
    'apps/web/package.json': JSON.stringify({ name: 'web', dependencies: { next: '*' } }),
    'apps/excluded/package.json': '{}',
  });
  try {
    const result = await inspectProjectAsync(fixture);
    expect(result.complete).toBe(true);
    expect(result.detection.traits.has('expo')).toBe(true);
    expect(result.detection.traits.has('next')).toBe(true);
    expect(result.workspaces[0]?.packagePaths).toEqual(['apps/mobile', 'apps/web']);
    expect(
      result.packages.find((item) => item.name === 'mobile')?.detection.traits.has('expo'),
    ).toBe(true);
    expect(result.packages.find((item) => item.name === 'web')?.detection.traits.has('expo')).toBe(
      false,
    );
    expect(
      result.packages.find((item) => item.name === 'root')?.detection.traits.has('typescript'),
    ).toBe(false);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('reads pnpm patterns, prunes dependency/build files and never executes configs', async () => {
  const fixture = await createFixtureAsync({
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'packages/lib/package.json': '{}',
    'packages/lib/src/main.kt': '',
    'node_modules/fake/index.py': '',
    'dist/generated.cpp': '',
    'app.config.js': 'throw new Error("must not execute")',
  });
  try {
    const result = await inspectProjectAsync(fixture);
    expect(result.workspaces[0]?.packagePaths).toEqual(['packages/lib']);
    expect(result.detection.traits.has('kotlin')).toBe(true);
    expect(result.detection.traits.has('python')).toBe(false);
    expect(result.detection.traits.has('cpp')).toBe(false);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('reports malformed and oversized manifests', async () => {
  const fixture = await createFixtureAsync({
    'package.json': '{broken',
    'pnpm-workspace.yaml': 'packages: false',
    'pom.xml': 'x'.repeat(300),
  });
  try {
    const result = await inspectProjectAsync(fixture, { maxManifestBytes: 100 });
    expect(result.complete).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toContain('invalid-manifest');
    expect(result.diagnostics.map((item) => item.code)).toContain('invalid-workspace');
    expect(result.diagnostics.map((item) => item.code)).toContain('manifest-unreadable');
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('reports scan limits and supports cancellation', async () => {
  const fixture = await createFixtureAsync({ 'one/a/b/Main.java': '', 'two/main.py': '' });
  try {
    expect((await inspectProjectAsync(fixture, { maxDepth: 1 })).complete).toBe(false);
    expect((await inspectProjectAsync(fixture, { maxEntries: 1 })).complete).toBe(false);
    await rejects(inspectProjectAsync(fixture, { maxEntries: 0 }), /positive/u);
    await rejects(inspectProjectAsync(fixture, { signal: AbortSignal.abort() }));
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('skips symlinked directories and manifests, including loops', async () => {
  const fixture = await createFixtureAsync({
    'src/index.ts': '',
    'original.json': '{"dependencies":{"expo":"*"}}',
  });
  try {
    await symlink(fixture, path.join(fixture, 'loop'));
    await symlink(path.join(fixture, 'original.json'), path.join(fixture, 'package.json'));
    const result = await inspectProjectAsync(fixture);
    expect(result.complete).toBe(false);
    expect(result.detection.traits.has('expo')).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'symlink-skipped')).toHaveLength(2);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('prunes generated Ankh materialization without treating its runtime link as incomplete', async () => {
  const fixture = await createFixtureAsync({
    'index.ts': '',
    'src/main.ts': '',
    '.ankh/zora/.web-gen-1/src/generated.ts': '',
  });
  try {
    await mkdir(path.join(fixture, '.ankh/zora'), { recursive: true });
    await symlink(
      path.join(fixture, '.ankh/zora/.web-gen-1'),
      path.join(fixture, '.ankh/zora/web'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    const result = await inspectProjectAsync(fixture);
    expect(result.complete).toBe(true);
    expect(result.files).toEqual(['index.ts', 'src/main.ts']);
    expect(result.detection.traits.has('typescript')).toBe(true);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('retains scanned empty directories in a sorted project-relative inventory', async () => {
  const fixture = await createFixtureAsync({
    'src/nested/main.py': '',
    'node_modules/hidden/index.py': '',
  });
  try {
    await mkdir(path.join(fixture, 'src/empty'));
    const result = await inspectProjectAsync(fixture);

    expect(result.complete).toBe(true);
    expect(result.directories).toEqual(['src', 'src/empty', 'src/nested']);
    expect(result.files).toEqual(['src/nested/main.py']);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('supports custom manifest evidence and explicit extra exclusions', async () => {
  const fixture = await createFixtureAsync({ 'project.custom': 'custom', 'ignored/main.py': '' });
  try {
    const result = await inspectProjectAsync(fixture, {
      manifestNames: ['project.custom'],
      excludeDirectories: ['ignored'],
      detectors: [
        {
          id: 'custom',
          detect: (input) =>
            input.contents?.get('project.custom') === 'custom'
              ? [{ kind: 'framework', value: 'custom', evidence: 'project.custom', weight: 1 }]
              : [],
        },
      ],
    });
    expect([...result.detection.traits]).toEqual(['custom']);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('prunes project-relative file exclusion globs before detection', async () => {
  const fixture = await createFixtureAsync({
    'src/main.ts': '',
    'src/main.test.ts': '',
    'src/nested/widget.spec.ts': '',
    'root.spec.ts': '',
  });
  try {
    const result = await inspectProjectAsync(fixture, {
      excludeFiles: ['**/*.test.*', '**/*.spec.*'],
    });

    expect(result.complete).toBe(true);
    expect(result.files).toEqual(['src/main.ts']);
    expect(result.detection.traits.has('typescript')).toBe(true);
  } finally {
    await rm(fixture, { recursive: true });
  }
});

test('can inspect through an injected evidence port without a filesystem', async () => {
  const result = await inspectWithPortAsync('virtual', {
    readAsync: () =>
      Promise.resolve({
        rootPath: 'virtual',
        directories: [],
        files: ['Main.kt'],
        contents: new Map(),
        diagnostics: [],
        complete: true,
      }),
  });
  expect(result.detection.traits.has('kotlin')).toBe(true);
});

test('rejects missing roots and accepts an empty project without guessing', async () => {
  const fixture = await createFixtureAsync({});
  try {
    const result = await inspectProjectAsync(fixture);
    expect(result.complete).toBe(true);
    expect(result.diagnostics[0]?.code).toBe('unknown-project');
    await rejects(inspectProjectAsync(path.join(fixture, 'missing')));
  } finally {
    await rm(fixture, { recursive: true });
  }
});

async function createFixtureAsync(files: Readonly<Record<string, string>>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'project-detector-test-'));
  await Promise.all(
    Object.entries(files).map(async ([file, text]) => {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, text);
    }),
  );
  return root;
}
import { rejects } from 'node:assert/strict';
