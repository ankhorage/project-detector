import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';

import { inspect } from './commands/inspect.js';
import { runAsync } from './runAsync.js';

/*** Create the Ankh CLI adapter without coupling the detection core to Ankh. */
export function createCliProvider(version: string): AnkhRuntimeCommandProvider {
  return {
    id: '@ankhorage/project-detector',
    category: 'project-detector',
    version,
    capabilities: [inspect.capability],
    commands: [{ path: inspect.path, capability: inspect.capability, summary: inspect.summary }],
    handlers: [
      {
        path: inspect.path,
        handler: async (request) => ({
          exitCode: await runAsync(['inspect', ...request.argv], request.context),
        }),
      },
    ],
  };
}
