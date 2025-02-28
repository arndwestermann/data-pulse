import { FormControl } from '@angular/forms';
import { Specialty } from '.';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';

export interface IRecordForm {
	uuid: FormControl<string | null>;
	id: FormControl<string>;
	arrival: FormControl<[TuiDay, TuiTime]>;
	leaving: FormControl<[TuiDay, TuiTime] | null>;
	from: FormControl<string>;
	to: FormControl<string>;
	specialty: FormControl<Specialty>;
}
