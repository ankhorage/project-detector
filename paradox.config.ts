import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  docs: {
    title: '@ankhorage/project-detector',
    description: 'Extensible, evidence-based project detection and safe filesystem inspection.',
  },
  package: {
    root: '.',
    entrypoints: ['src/projectDetector.ts', 'src/nodeProjectDetector.ts'],
  },
  output: { dir: './paradox' },
});
