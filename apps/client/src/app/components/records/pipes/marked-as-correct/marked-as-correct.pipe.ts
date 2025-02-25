import { Pipe, PipeTransform } from '@angular/core';
import { IRecord } from '../../../../shared/models';

@Pipe({
	name: 'markedAsCorrect',
})
export class MarkedAsCorrectPipe implements PipeTransform {
	transform(record: IRecord, markedAsCorrect: string[]): boolean {
		return markedAsCorrect.includes(record.uuid ?? '');
	}
}
