import { TOperator } from './operator.model';

export interface FilterCondition {
	value: unknown;
	operator?: TOperator;
}

export type FilterInput = unknown | FilterCondition;

export interface IQueryOptions {
	page?: number;
	size?: number;
	search?: string;
	filters?: Record<string, FilterInput>;
	order?: 'asc' | 'desc';
	orderBy?: string;
}
