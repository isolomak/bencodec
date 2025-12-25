import { defineConfig } from 'tsup';

export default defineConfig({
	entry: [ 'src/index.ts' ],
	format: [ 'esm', 'cjs' ],
	dts: true,
	clean: true,
	outDir: 'lib',
	splitting: false,
	sourcemap: false,
	minify: false,
});
