import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { parseDateString } from '../parse-date-string/parse-date-string.util';
import { FilterCondition } from '../../models/query.model';
import { TOperator } from '../../models/operator.model';
import { DATE_FORMATS } from '../../models/constants';

export function applyDynamicFilters<T extends ObjectLiteral>(
	qb: SelectQueryBuilder<T>,
	alias: string,
	userId: string,
	filters?: Record<string, unknown>,
	dateFields: string[] = [],
): void {
	qb.andWhere(`${alias}.user = :userId`, { userId });

	if (!filters || Object.keys(filters).length === 0) return;

	const orGroups: string[][] = [];
	const parameters: Record<string, unknown> = {};
	let paramCounter = 0;

	for (const [key, value] of Object.entries(filters)) {
		const result = processFilter(alias, key, value, dateFields, paramCounter);

		if (result) {
			orGroups.push(result.conditions);
			Object.assign(parameters, result.parameters);
			paramCounter = result.paramCounter;
		}
	}

	if (orGroups.length > 0) {
		const whereClause = orGroups
			.map((group) => {
				if (group.length === 1) {
					return group[0];
				}
				return `(${group.join(' OR ')})`;
			})
			.join(' AND ');

		qb.andWhere(whereClause, parameters);
	}
}

function processFilter(
	alias: string,
	key: string,
	filterInput: unknown,
	dateFields: string[],
	paramCounter: number,
	defaultOperator?: TOperator,
): { conditions: string[]; parameters: Record<string, unknown>; paramCounter: number } | null {
	const conditions: string[] = [];
	const parameters: Record<string, unknown> = {};

	const filterCondition = normalizeFilterInput(filterInput);
	const operator = filterCondition.operator || defaultOperator || 'eq'; // Default to 'eq'
	let { value } = filterCondition;

	if (dateFields.includes(key)) {
		if (Array.isArray(value)) {
			value = value.map((item) => (typeof item === 'string' ? (parseDateString(item, DATE_FORMATS) ?? item) : item));
		} else if (typeof value === 'string') {
			value = parseDateString(value, DATE_FORMATS) ?? value;
		}
	}

	if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
		for (const [subKey, subValue] of Object.entries(value)) {
			const result = processFilter(key, subKey, subValue as unknown, dateFields, paramCounter);
			if (result) {
				conditions.push(...result.conditions);
				Object.assign(parameters, result.parameters);
				paramCounter = result.paramCounter;
			}
		}
		return { conditions, parameters, paramCounter };
	}

	switch (operator) {
		case 'eq': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} = :${paramName}`);
			parameters[paramName] = value;
			break;
		}

		case 'ne': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} != :${paramName}`);
			parameters[paramName] = value;
			break;
		}
		case 'like':
			if (Array.isArray(value)) {
				for (const v of value) {
					const paramName = `param_${paramCounter++}`;
					conditions.push(`${alias}.${key} LIKE :${paramName}`);
					parameters[paramName] = `%${v}%`;
				}
			} else {
				const paramName = `param_${paramCounter++}`;
				conditions.push(`${alias}.${key} LIKE :${paramName}`);
				parameters[paramName] = `%${value}%`;
			}
			break;

		case 'in':
			if (Array.isArray(value)) {
				const paramName = `param_${paramCounter++}`;
				conditions.push(`${alias}.${key} IN (:...${paramName})`);
				parameters[paramName] = value;
			}
			break;

		case 'notIn':
			if (Array.isArray(value)) {
				const paramName = `param_${paramCounter++}`;
				conditions.push(`${alias}.${key} NOT IN (:...${paramName})`);
				parameters[paramName] = value;
			}
			break;

		case 'gt': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} > :${paramName}`);
			parameters[paramName] = value;
			break;
		}
		case 'gte': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} >= :${paramName}`);
			parameters[paramName] = value;
			break;
		}
		case 'lt': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} < :${paramName}`);
			parameters[paramName] = value;
			break;
		}

		case 'lte': {
			const paramName = `param_${paramCounter++}`;
			conditions.push(`${alias}.${key} <= :${paramName}`);
			parameters[paramName] = value;
			break;
		}
		case 'between':
			if (Array.isArray(value) && value.length === 2) {
				const paramName1 = `param_${paramCounter++}`;
				const paramName2 = `param_${paramCounter++}`;
				conditions.push(`${alias}.${key} BETWEEN :${paramName1} AND :${paramName2}`);
				parameters[paramName1] = value[0];
				parameters[paramName2] = value[1];
			}
			break;

		case 'isNull':
			conditions.push(`${alias}.${key} IS NULL`);
			break;

		case 'isNotNull':
			conditions.push(`${alias}.${key} IS NOT NULL`);
			break;
	}

	return { conditions, parameters, paramCounter };
}

function isFilterCondition<T>(object: T | FilterCondition): object is FilterCondition {
	return object !== null && object !== undefined && typeof object === 'object' && 'operator' in object;
}

function normalizeFilterInput(input: unknown): FilterCondition {
	if (isFilterCondition(input)) {
		return {
			value: input.value,
			operator: input.operator ?? 'eq',
		};
	}

	return {
		value: input,
		operator: 'eq', // Default to 'eq'
	};
}
