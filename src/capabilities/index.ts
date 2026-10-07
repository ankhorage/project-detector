import type { Capability } from '@ankhorage/contracts/capabilities';

export const CAPABILITIES = [
  {
    id: 'project-detector.inspect',
    owner: '@ankhorage/project-detector',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Inspect project',
    description:
      'Inspect project languages, packages and workspaces without executing project code.',
  },
] as const satisfies readonly Capability[];
