// import { DoWork, runWorker } from '@arndwestermann/observable-webworker';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { IRecord } from '../../shared/models';
// import { KeyValue } from '@angular/common';
//
// /**
//  * @returns Empty array
//  * @deprecated Removed in future version
//  */
// export class HeatmapWorker implements DoWork<{ records: IRecord[]; from: Date; to: Date }, KeyValue<Date, IRecord[][]>[]> {
// 	public work(input$: Observable<{ records: IRecord[]; from: Date; to: Date }>): Observable<KeyValue<Date, IRecord[][]>[]> {
// 		return input$.pipe(map(({ records, from, to }) => []));
// 	}
// }
//
// runWorker(HeatmapWorker);
