export function hashObject(obj: unknown) {
	const str = JSON.stringify(obj, (_key, value) => {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return Object.keys(value)
				.sort()
				.reduce((s, k) => ({ ...s, [k]: value[k] }), {} as Record<string, unknown>);
		}
		return value;
	});

	return djb2Hash(str);
}

function djb2Hash(str: string): string {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i);
	}
	return (hash >>> 0).toString(16);
}
