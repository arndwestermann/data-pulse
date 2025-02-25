import { FormControl } from '@angular/forms';
import { Specialty } from '../../../shared/models';

export interface IRecordForm {
	uuid: FormControl<string | null>;
	id: FormControl<string>;
	arrival: FormControl<Date>;
	leaving: FormControl<Date>;
	from: FormControl<string>;
	to: FormControl<string>;
	specialty: FormControl<Specialty>;
}
