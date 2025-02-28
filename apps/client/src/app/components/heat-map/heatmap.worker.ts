import { DoWork, runWorker } from '@arndwestermann/observable-webworker';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getHeatMap } from './utils/get-heat-map/get-heat-map.util';
import { IRecord } from '../../shared/models';
import { IHeatMap } from './models/heat-map.model';

export class HeatmapWorker implements DoWork<{ records: IRecord[]; from: Date; to: Date }, IHeatMap[]> {
	public work(input$: Observable<{ records: IRecord[]; from: Date; to: Date }>): Observable<IHeatMap[]> {
		return input$.pipe(map(({ records, from, to }) => getHeatMap(records, from, to)));
	}
}

runWorker(HeatmapWorker);
