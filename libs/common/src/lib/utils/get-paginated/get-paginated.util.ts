import { Observable, EMPTY, map, expand, reduce } from 'rxjs';

export function getPaginated<T, R>(
	fetchFn: (page: number) => Observable<T>,
	extractData: (response: T) => R[],
	firstPage = 1,
	fetchAll = true,
): Observable<R[]> {
	let page = firstPage;
	if (!fetchAll) return fetchFn(page).pipe(map(extractData));

	return fetchFn(page).pipe(
		expand((response) => {
			const data = extractData(response);
			if (data.length === 0) return EMPTY;
			page++;
			return fetchFn(page);
		}),
		map((response) => extractData(response)),
		reduce((acc, items) => acc.concat(items), [] as R[]),
	);
}
