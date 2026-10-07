import { areCapabilitiesEqual, isCapability } from '@ankhorage/contracts/capabilities';
import { describe, expect, test } from 'bun:test';

import packageJson from '../../package.json' with { type: 'json' };
import { createCliProvider } from '../cli/createCliProvider.js';
import { CAPABILITIES } from './index.js';

describe('Project Detector capabilities', () => {
  test('publishes one canonical inspect capability', () => {
    expect(CAPABILITIES).toHaveLength(1);
    expect(CAPABILITIES.every(isCapability)).toBeTrue();
    expect(new Set(CAPABILITIES.map(({ id }) => id)).size).toBe(CAPABILITIES.length);
    expect(CAPABILITIES[0]).toMatchObject({
      id: 'project-detector.inspect',
      owner: '@ankhorage/project-detector',
      access: ['invoke'],
      binding: { kind: 'action', bindableAs: ['target'] },
    });
  });

  test('keeps package metadata and provider capabilities aligned with the catalog', () => {
    expect(packageJson.exports['./capabilities']).toEqual({
      types: './dist/capabilities/index.d.ts',
      import: './dist/capabilities/index.js',
    });
    expect(packageJson.ankh.capabilities).toHaveLength(CAPABILITIES.length);
    for (const [index, capability] of CAPABILITIES.entries()) {
      const published = packageJson.ankh.capabilities.at(index);
      expect(isCapability(published)).toBeTrue();
      if (!isCapability(published)) continue;
      expect(areCapabilitiesEqual(published, capability)).toBeTrue();
    }

    const provider = createCliProvider(packageJson.version);
    expect(provider.capabilities).toBe(CAPABILITIES);
    expect(new Set(provider.commands.map((command) => String(command.capability)))).toEqual(
      new Set(CAPABILITIES.map(({ id }) => id)),
    );
  });
});
