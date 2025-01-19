import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'filterSpecialties',
})
export class FilterSpecialtiesPipe implements PipeTransform {
	transform(specialties: string[], value: string[]): string[] {
		return specialties.filter((specialty) => !value.includes(specialty));
	}
}
