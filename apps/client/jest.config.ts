export default {
	displayName: 'client',
	preset: '../../jest.preset.js',
	testEnvironment: '../../3rd-party-lib-patches/patch-jsodm-environment.ts', // TODO: Remove once fixed
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	coverageDirectory: '../../coverage/apps/client',
	transform: {
		'^.+\\.(ts|mjs|js|html)$': [
			'jest-preset-angular',
			{
				tsconfig: '<rootDir>/tsconfig.spec.json',
				stringifyContentPathRegex: '\\.(html|svg)$',
			},
		],
	},
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment',
	],
};
