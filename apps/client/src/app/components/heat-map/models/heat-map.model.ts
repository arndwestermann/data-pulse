import { IRecord } from '../../../shared/models';

export interface IHeatMap {
	key: Date;
	value: IRecord[][];
}
