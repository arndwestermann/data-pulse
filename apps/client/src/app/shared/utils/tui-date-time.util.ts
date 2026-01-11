import { TuiDay, TuiMonth, TuiTime } from '@taiga-ui/cdk';

export function toNativeDateTime(day: TuiDay, time: TuiTime): Date {
	return new Date(day.year ?? 0, day.month ?? 0, day.day ?? 0, time.hours, time.minutes, time.seconds);
}
export function toTuiDayTime(date: Date): [TuiDay, TuiTime] {
	return [toTuiDay(date), toTuiTime(date)];
}

export function toTuiMonth(date?: Date): TuiMonth | null {
	if (!date) return null;

	return new TuiMonth(date.getFullYear(), date.getMonth());
}

export function toTuiDay(date: Date): TuiDay {
	return new TuiDay(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toTuiTime(date: Date): TuiTime {
	return new TuiTime(date.getHours(), date.getMinutes(), date.getSeconds());
}
