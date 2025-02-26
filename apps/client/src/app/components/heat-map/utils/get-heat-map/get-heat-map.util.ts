import { startOfMonth, endOfMonth, isWithinInterval, isSameDay, isBefore, differenceInDays, addDays } from 'date-fns';
import { IHeatMap } from '../../models/heat-map.model';
import { IRecord } from '../../../../shared/models';

export function getHeatMap(data: IRecord[], startDate?: Date, endDate?: Date): IHeatMap[] {
	const start = startDate || startOfMonth(new Date());
	const end = endDate || endOfMonth(new Date());
	const now = new Date();

	const heatmap: IHeatMap[] = Array.from({ length: differenceInDays(end, start) + 1 }, (_, index) => ({
		key: addDays(start, index),
		value: Array(24)
			.fill(0)
			.map(() => []) as IRecord[][],
	}));

	for (const entry of data) {
		const daysStaying = heatmap.filter((item) =>
			isWithinInterval(item.key, {
				start: new Date(entry.arrival.getFullYear(), entry.arrival.getMonth(), entry.arrival.getDate(), 0, 0, 0),
				end: new Date((entry.leaving ?? now).getFullYear(), (entry.leaving ?? now).getMonth(), (entry.leaving ?? now).getDate(), 23, 59, 59),
			}),
		);

		for (const day of daysStaying) {
			const firstHour = entry.arrival.getHours();
			const lastHour = (entry.leaving ?? now).getHours();

			const start = isBefore(entry.arrival, day.key) ? 0 : firstHour;
			const end = isSameDay(day.key, entry.leaving ?? now) ? lastHour : 23;

			for (let hour = start; hour <= end; hour++) {
				day.value[hour].push(entry);
			}
		}
	}
	return heatmap;
}
