import { IsIn, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
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

export class QueryOptions implements IQueryOptions {
	@IsNumber()
	@IsPositive()
	@IsOptional()
	@Type(() => Number)
	page?: number;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	@Type(() => Number)
	size?: number;

	@IsString()
	@IsOptional()
	search?: string;

	@IsObject()
	@IsOptional()
	filters?: Record<string, FilterInput>;

	@IsString()
	@IsIn(['asc', 'desc'])
	@IsOptional()
	order?: 'asc' | 'desc';

	@IsString()
	@IsOptional()
	orderBy?: string;
}
