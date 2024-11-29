import { Directive } from '@angular/core';
import { TuiDay, TuiTime, TuiValueTransformer } from '@taiga-ui/cdk';
import { TUI_DATE_TIME_VALUE_TRANSFORMER } from '@taiga-ui/kit';

type From = [TuiDay | null, TuiTime | null];

type To = Date | null;

class DateTimeTransformer implements TuiValueTransformer<From, To> {
	fromControlValue(controlValue: To): From {
		const day = controlValue ? TuiDay.fromLocalNativeDate(controlValue) : null;
		const time = controlValue ? TuiTime.fromLocalNativeDate(controlValue) : null;
		// TODO: check error:
		// Type '[TuiDay | null, TuiTime | null] | null' is not assignable to type 'From'.
		// Type 'null' is not assignable to type '[TuiDay | null, TuiTime | null]'
		// Removed `controlValue &&`
		return [day, time];
	}

	toControlValue(componentValue: From): To {
		const time = componentValue[1] ? [componentValue[1].hours, componentValue[1].minutes, componentValue[1].seconds] : [0, 0, 0];
		// TODO: Check, added `?` and `?? 0`
		const date = new Date(componentValue[0]?.year ?? 0, componentValue[0]?.month ?? 0, componentValue[0]?.day ?? 0, time[0], time[1], time[2]);
		return componentValue && date;
	}
}

@Directive({
	// eslint-disable-next-line @angular-eslint/directive-selector
	selector: 'tui-input-date-time[toNativeDatetime]',
	standalone: true,
	providers: [
		{
			provide: TUI_DATE_TIME_VALUE_TRANSFORMER,
			useClass: DateTimeTransformer,
		},
	],
})
export class NativeDatetimeTransformerDirective {}
