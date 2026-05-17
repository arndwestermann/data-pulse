export interface ObjectDiff {
	added: Record<string, unknown>;
	updated: {
		[key: string]: Updated | ObjectDiff;
	};
	removed: Record<string, unknown>;
	unchanged: Record<string, unknown>;
	isDifferent: boolean;
}

export interface Updated {
	oldValue: unknown;
	newValue: unknown;
}
