import { mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { CAPABILITIES } from '../capabilities/index.js';
import { createCliProvider } from './createCliProvider.js';
import { runAsync } from './runAsync.js';

test('prints standalone help and rejects invalid commands', async () => {
  const output: string[] = [];
  const errors: string[] = [];
  const context = {
    cwd: '.',
    writeStdout: (text: string) => {
      output.push(text);
    },
    writeStderr: (text: string) => {
      errors.push(text);
    },
  };
  expect(await runAsync(['--help'], context)).toBe(0);
  expect(output.join('')).toContain('inspect');
  expect(await runAsync(['update'], context)).toBe(1);
  expect(errors.join('')).toContain('Unknown command');
});

test('provides an Ankh command with matching handler and capability', () => {
  const provider = createCliProvider('test-version');
  expect(provider.category).toBe('project-detector');
  expect(provider.commands[0]?.path).toEqual(['inspect']);
  expect(provider.handlers?.[0]?.path).toEqual(['inspect']);
  expect(provider.capabilities).toBe(CAPABILITIES);
  expect(provider.commands[0]?.capability).toBe('project-detector.inspect');
});

test('returns success with a path-bearing warning for a skipped symlink', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'project-detector-cli-link-'));
  try {
    await writeFile(path.join(fixture, 'index.ts'), '');
    await symlink('index.ts', path.join(fixture, 'arbitrary-link.ts'));
    const output: string[] = [];
    const exitCode = await runAsync(['inspect', fixture], {
      cwd: fixture,
      writeStdout: (value) => output.push(value),
      writeStderr: () => undefined,
    });
    const result = JSON.parse(output.join('')) as {
      complete: boolean;
      diagnostics: { code: string; message: string; path?: string; severity?: string }[];
    };

    expect(exitCode).toBe(0);
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toEqual([
      {
        code: 'symlink-skipped',
        path: path.join(await realpath(fixture), 'arbitrary-link.ts'),
        message: 'Symbolic links are not followed.',
        severity: 'warning',
      },
    ]);
  } finally {
    await rm(fixture, { recursive: true });
  }
});
