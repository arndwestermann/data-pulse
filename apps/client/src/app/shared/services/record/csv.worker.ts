import { CSV_DATA_SEPARATOR, CSV_LINE_SEPARATOR, IRecord, IWorker, Specialty } from '../../models';
import { parseCSV } from '../../utils';

addEventListener('message', ({ data }: MessageEvent<IWorker<File>>) => {
	const fileReader = new FileReader();

	fileReader.onload = () => {
		const parsedCsv = parseCSV<{
			id: string;
			runningId: string;
			number: string;
			arrivalDate: string;
			arrivalTime: string;
			leavingDate: string;
			leavingTime: string;
			from: string;
			to: string;
			specialty: string;
			infection: string;
		}>(fileReader.result as string, CSV_LINE_SEPARATOR, CSV_DATA_SEPARATOR);
		const records: IRecord[] = [];

		for (const element of parsedCsv) {
			const arraivalDate = element.arrivalDate.split('.');
			const arraivalTime = element.arrivalTime.split(':');
			const leavingDate = element.leavingDate.split('.');
			const leavingTime = element.leavingTime.split(':');

			const yearArrival = +arraivalDate[2];
			const monthArrival = +arraivalDate[1];
			const dayArrival = +arraivalDate[0];
			const hourArrival = +arraivalTime[0];
			const minuteArrival = +arraivalTime[1];
			const secondArrival = +arraivalTime[2];

			const yearLeaving = +leavingDate[2];
			const monthLeaving = +leavingDate[1];
			const dayLeaving = +leavingDate[0];
			const hourLeaving = +leavingTime[0];
			const minuteLeaving = +leavingTime[1];
			const secondLeaving = +leavingTime[2];

			const arrival = new Date(yearArrival, monthArrival - 1, dayArrival, hourArrival, minuteArrival, secondArrival);
			const leaving = new Date(yearLeaving, monthLeaving - 1, dayLeaving, hourLeaving, minuteLeaving, secondLeaving);

			records.push({
				id: element.id,
				arrival,
				leaving,
				from: element.from,
				to: element.to,
				specialty: element.specialty as Specialty,
			});
		}

		const response = { message: 'csv', data: records } satisfies IWorker<IRecord[]>;
		postMessage(response);
	};

	fileReader.readAsText(data.data);
});
