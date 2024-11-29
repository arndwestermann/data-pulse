export interface DeepDiff {
	added: Record<string, unknown>;
	updated: {
		[key: string]: Updated | DeepDiff;
	};
	removed: Record<string, unknown>;
	unchanged: Record<string, unknown>;
	isDifferent: boolean;
}

export interface Updated {
	oldValue: unknown;
	newValue: unknown;
}
