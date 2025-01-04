export function downloadURI(uri: string, name: string) {
	const link = document.createElement('a');
	link.download = name;
	link.href = uri;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function getUUID(): string {
	if ('randomUUID' in crypto) return crypto.randomUUID();

	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
