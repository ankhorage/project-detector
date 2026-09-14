import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { inspectProjectAsync } from '../../../nodeProjectDetector.js';

test('limits total manifest text across individually small files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'detector-byte-budget-'));
  try {
    await mkdir(path.join(root, 'nested'));
    await writeFile(path.join(root, 'package.json'), '{}');
    await writeFile(path.join(root, 'nested/package.json'), '{}');
    const result = await inspectProjectAsync(root, { maxTotalManifestBytes: 2 });
    expect(result.complete).toBe(false);
    expect(result.diagnostics.some((item) => item.code === 'manifest-unreadable')).toBe(true);
  } finally {
    await rm(root, { recursive: true });
  }
});
