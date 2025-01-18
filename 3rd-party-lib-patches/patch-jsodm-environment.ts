import JSDOMEnvironment from 'jest-environment-jsdom';

// https://github.com/facebook/jest/blob/v29.4.3/website/versioned_docs/version-29.4/Configuration.md#testenvironment-string
export default class PatchJSDOMEnvironment extends JSDOMEnvironment {
	constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
		super(...args);

		// TODO: Remove once https://github.com/jsdom/jsdom/issues/3363 is fixed
		this.global.structuredClone = structuredClone;
	}
}
