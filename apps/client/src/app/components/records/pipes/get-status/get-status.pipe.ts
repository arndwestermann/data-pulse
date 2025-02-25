import { Pipe, PipeTransform } from '@angular/core';
import { IRecord, Status } from '../../../../shared/models';
import { getStatus } from '../../../../shared/utils';

@Pipe({
	name: 'getStatus',
})
export class GetStatusPipe implements PipeTransform {
	transform(record: IRecord): Status | null {
		return getStatus(record.leaving, record.arrival);
	}
}
