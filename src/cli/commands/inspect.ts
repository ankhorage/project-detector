import path from 'node:path';

import { inspectProjectAsync } from '../../features/inspection/composition/inspectProjectAsync.js';
import type { ProjectDetectorCliContext } from '../../types/cli.js';

/*** Map the inspect command to read-only inspection and serializable JSON output. */
export const inspect = {
  path: ['inspect'],
  capability: 'project-detector.inspect' as const,
  summary: 'Inspect project languages, packages and workspaces without executing project code.',
  executeAsync: async (
    argv: readonly string[],
    context: ProjectDetectorCliContext,
  ): Promise<number> => {
    const [directory = '.'] = argv;
    if (argv.length > 1 || directory.startsWith('-'))
      throw new Error('Usage: project-detector inspect [directory]');
    const result = await inspectProjectAsync(path.resolve(context.cwd, directory));
    context.writeStdout(
      `${JSON.stringify(result, (_key, value: unknown) => (value instanceof Set ? [...value] : value), 2)}\n`,
    );
    return result.complete ? 0 : 2;
  },
};
