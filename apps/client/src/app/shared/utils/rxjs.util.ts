import { UnaryFunction, Observable, pipe, filter, OperatorFunction } from 'rxjs';

// Kudos to https://stackoverflow.com/a/62971842/15181911
export function filterNullish<T>(): UnaryFunction<Observable<T | null | undefined>, Observable<T>> {
	return pipe(filter((value) => value !== null && value !== undefined) as OperatorFunction<T | null | undefined, T>);
}
