export default {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	verbose: true,
	collectCoverage: true,
	reporters: [ 'default' ],
	extensionsToTreatAsEsm: [ '.ts' ],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
};
