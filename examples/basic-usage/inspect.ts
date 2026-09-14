import { detectProject } from '@ankhorage/project-detector';
import { inspectProjectAsync } from '@ankhorage/project-detector/node';

console.log(detectProject({ dependencies: { expo: '*' } }).traits);
console.log(await inspectProjectAsync(process.argv[2] ?? '.'));
