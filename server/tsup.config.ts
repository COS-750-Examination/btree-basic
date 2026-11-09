import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Bundle the workspace packages (they ship TypeScript source), keep npm deps external.
  noExternal: [/^@btree\//],
});
