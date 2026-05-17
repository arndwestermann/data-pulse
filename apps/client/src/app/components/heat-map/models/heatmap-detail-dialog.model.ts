import { IRecord } from '../../../shared/models';

export interface IHeatmapDetailDialogContext {
	day: Date;
	records: IRecord[];
	locale: string;
}
