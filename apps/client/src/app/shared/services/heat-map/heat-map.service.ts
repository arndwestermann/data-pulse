import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Params } from '@angular/router';

import { combineLatest, map, merge, scan, share, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { stringify as stringifyQueryParams } from 'qs';
import { IPage } from '@arndwestermann/common';

import { environment } from '../../../../environments/environment';
import { IRecord, IRecordDto, TCrud } from '../../models';
import { mapDtoToRecord } from '../../utils';
import { KeyValue } from '@angular/common';

@Injectable({
	providedIn: 'root',
})
export class HeatMapService {
	private readonly http = inject(HttpClient);

	private readonly queryParamsSubject = new Subject<Params>();
	private readonly readSubject = new Subject<void>();

	private readonly read$ = combineLatest([this.readSubject.pipe(startWith(void 0)), this.queryParamsSubject]).pipe(
		switchMap(([, queryParams]) => {
			const queryParamsString = stringifyQueryParams(queryParams, { addQueryPrefix: true });

			return this.http.get<IPage<KeyValue<Date, IRecordDto[][]>[]>>(`${environment.baseUrl}/record/heat-map${queryParamsString}`);
		}),
		share(),
	);

	private readonly events$ = merge(
		this.read$.pipe(
			map((value) => {
				const data = value.data.map((item) => ({ ...item, value: item.value.map((hour) => hour.map(mapDtoToRecord)) }));
				return { type: 'read', value: data } as TCrud<KeyValue<Date, IRecord[][]>[], 'read'>;
			}),
		),
	);

	public readonly heatmap$ = this.events$.pipe(
		scan(
			(state, event) => {
				switch (event.type) {
					case 'read':
						state = [...event.value];
						break;

					default:
						break;
				}
				return state;
			},
			[] as KeyValue<Date, IRecord[][]>[],
		),
		shareReplay({ bufferSize: 1, refCount: true }),
	);

	public setQueryParams(params: Params): void {
		console.log(params);
		this.queryParamsSubject.next(params);
	}
}
