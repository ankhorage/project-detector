#!/usr/bin/env node
import type { ProjectDetectorCliContext } from '../types/cli.js';
import { inspect } from './commands/inspect.js';

/***
 * Run `project-detector inspect [directory]` standalone, or `ankh project-detector inspect`.
 * JSON output includes diagnostics. Exit codes: 0 complete, 1 invalid invocation/failure,
 * 2 incomplete inspection. Unknown project evidence is not an execution failure.
 * @readme
 */
export async function runAsync(
  argv: readonly string[],
  context: ProjectDetectorCliContext,
): Promise<number> {
  try {
    const [command, ...args] = argv;
    if (command === '--help' || command === 'help' || command === undefined) {
      context.writeStdout('Usage: project-detector inspect [directory]\n');
      return 0;
    }
    if (command !== 'inspect') throw new Error(`Unknown command: ${command}`);
    return await inspect.executeAsync(args, context);
  } catch (error) {
    context.writeStderr(`${toErrorMessage(error)}\n`);
    return 1;
  }
}

if (import.meta.main) {
  process.exitCode = await runAsync(process.argv.slice(2), {
    cwd: process.cwd(),
    writeStdout: (text) => {
      process.stdout.write(text);
    },
    writeStderr: (text) => {
      process.stderr.write(text);
    },
  });
}
import { toErrorMessage } from '@ankhorage/utility/error';
