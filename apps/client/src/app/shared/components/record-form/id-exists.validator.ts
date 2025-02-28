import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { RecordService } from '../../services';
import { of, filter, map, debounceTime, switchMap } from 'rxjs';

export function idExitsValidator(recordsService: RecordService): AsyncValidatorFn {
	return (control: AbstractControl) => {
		return of(control.value).pipe(
			filter((value) => value),
			debounceTime(500),
			switchMap((value) => recordsService.getByRecordsId(value)),
			map((value) => (value ? { idExists: true } : null)),
		);
	};
}
