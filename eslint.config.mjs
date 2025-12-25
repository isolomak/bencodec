import stylistic from '@stylistic/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
	{
		plugins: {
			'@stylistic': stylistic,
		},
		languageOptions: {
			parser,
		},
		files: [ '**/*.ts', '**/*.js', '*.mjs' ],
		ignores: [ 'node_modules/**', 'build/**', 'lib/**', 'dist/**' ],
		rules: {
			'@stylistic/array-bracket-newline': [ 'warn', { multiline: true, minItems: 5 }],
			'@stylistic/array-bracket-spacing': [ 'warn', 'always', { objectsInArrays: false, arraysInArrays: false }],
			'@stylistic/array-element-newline': [ 'warn', 'consistent', { multiline: true, minItems: 5 }],
			'@stylistic/arrow-parens': [ 'warn', 'as-needed' ],
			'@stylistic/arrow-spacing': 'warn',
			'@stylistic/block-spacing': 'warn',
			'@stylistic/brace-style': [ 'warn', 'stroustrup', { allowSingleLine: true }],
			'@stylistic/comma-dangle': [ 'warn', 'always-multiline' ],
			'@stylistic/comma-spacing': [ 'warn', { before: false, after: true }],
			'@stylistic/dot-location': [ 'warn', 'property' ],
			'@stylistic/eol-last': [ 'warn', 'always' ],
			'@stylistic/function-call-argument-newline': [ 'warn', 'consistent' ],
			'@stylistic/function-call-spacing': [ 'warn', 'never' ],
			'@stylistic/function-paren-newline': [ 'warn', 'multiline-arguments' ],
			'@stylistic/indent': [
				'warn', 'tab', {
					ignoredNodes: [
						'FunctionExpression > .params[decorators.length > 0]',
						'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
						'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',
					],
					SwitchCase: 1,
				},
			],
			'@stylistic/key-spacing': [ 'warn', { mode: 'strict' }],
			'@stylistic/keyword-spacing': [ 'warn' ],
			'@stylistic/lines-between-class-members': [
				'warn',
				{
					enforce: [
						{ blankLine: 'always', prev: '*', next: 'field' },
						{ blankLine: 'always', prev: 'field', next: '*' },
						{ blankLine: 'always', prev: 'method', next: 'method' },
					],
				},
				{ exceptAfterSingleLine: true },
			],
			'@stylistic/max-len': [
				'warn', {
					code: 180,
					tabWidth: 4,
					ignoreComments: true,
					ignoreTrailingComments: true,
					ignoreUrls: true,
					ignoreTemplateLiterals: true,
				},
			],
			'@stylistic/max-statements-per-line': [ 'warn', { max: 1 }],
			'@stylistic/member-delimiter-style': 'warn',
			'@stylistic/new-parens': 'warn',
			'@stylistic/newline-per-chained-call': [ 'warn', { ignoreChainWithDepth: 3 }],
			'@stylistic/no-confusing-arrow': 'warn',
			'@stylistic/no-extra-parens': [ 'warn', 'all', { nestedBinaryExpressions: false }],
			'@stylistic/no-extra-semi': 'warn',
			'@stylistic/no-floating-decimal': 'warn',
			'@stylistic/no-mixed-operators': 'warn',
			'@stylistic/no-mixed-spaces-and-tabs': 'warn',
			'@stylistic/no-multi-spaces': 'warn',
			'@stylistic/no-multiple-empty-lines': 'warn',
			'@stylistic/no-trailing-spaces': [ 'warn', { skipBlankLines: true }],
			'@stylistic/no-whitespace-before-property': 'warn',
			'@stylistic/nonblock-statement-body-position': [ 'warn', 'below' ],
			'@stylistic/object-curly-newline': [ 'warn', { consistent: true }],
			'@stylistic/object-curly-spacing': [ 'warn', 'always' ],
			'@stylistic/one-var-declaration-per-line': [ 'warn', 'always' ],
			'@stylistic/operator-linebreak': [ 'warn', 'before' ],
			'@stylistic/padded-blocks': [
				'warn',
				{
					blocks: 'never',
					classes: 'always',
					switches: 'never',
				},
				{
					allowSingleLineBlocks: true,
				},
			],
			'@stylistic/padding-line-between-statements': [
				'warn',
				{ blankLine: 'always', prev: '*', next: 'return' },
			],
			'@stylistic/quote-props': [ 'warn', 'as-needed' ],
			'@stylistic/quotes': [ 'warn', 'single', { avoidEscape: true }],
			'@stylistic/semi': [ 'warn', 'always', { omitLastInOneLineBlock: true }],
			'@stylistic/semi-spacing': 'warn',
			'@stylistic/semi-style': [ 'warn', 'last' ],
			'@stylistic/space-before-blocks': [
				'warn', {
					functions: 'always',
					keywords: 'always',
					classes: 'always',
				},
			],
			'@stylistic/space-before-function-paren': [
				'warn', {
					anonymous: 'never',
					named: 'never',
					asyncArrow: 'always',
				},
			],
			'@stylistic/space-in-parens': [ 'warn', 'never' ],
			'@stylistic/spaced-comment': [ 'warn', 'always' ],
			'@stylistic/switch-colon-spacing': 'warn',
			'@stylistic/template-curly-spacing': 'warn',
			'@stylistic/template-tag-spacing': 'warn',
			'@stylistic/type-annotation-spacing': 'warn',
			'@stylistic/type-generic-spacing': [ 'warn' ],
			'@stylistic/type-named-tuple-spacing': [ 'warn' ],
			'@stylistic/wrap-regex': 'warn',
		},
	},
];
