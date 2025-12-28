export interface IPage<T> {
	data: T;
	page: number;
	itemsPerPage: number;
	totalItems: number;
}
