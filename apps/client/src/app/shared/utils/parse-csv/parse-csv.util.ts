export function parseCSV<T>(csv: string, lineSeparator = '\n', delimiter = ',', hasHeader = true, headers: string[] = []): T[] {
	const lines = csv.split(lineSeparator);

	const objects: T[] = [];

	headers = headers.length > 0 ? headers : hasHeader ? (lines.shift()?.split(delimiter) ?? []) : [];

	for (const line of lines) {
		if (line.trim().length === 0) continue;

		const object: Record<string, unknown> = {};
		const columns = line.split(delimiter);
		for (let i = 0; i < columns.length; i++) {
			object[headers[i]] = columns[i];
		}
		objects.push(object as T);
	}

	return objects;
}
