import { expect, test } from 'bun:test';

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
  expect(provider.capabilities).toEqual(['project-detector.inspect']);
});
