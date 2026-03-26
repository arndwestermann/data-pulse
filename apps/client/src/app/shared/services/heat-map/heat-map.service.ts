import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Params } from '@angular/router';

import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
	catchError,
	combineLatest,
	EMPTY,
	expand,
	filter,
	forkJoin,
	from,
	fromEvent,
	map,
	merge,
	Observable,
	of,
	scan,
	share,
	shareReplay,
	startWith,
	Subject,
	switchMap,
} from 'rxjs';
import { stringify as stringifyQueryParams } from 'qs';
import { IPage } from '@arndwestermann/common';

import { environment } from '../../../../environments/environment';
import { IRecord, IRecordDto, IWorker, NEVER_ASK_DELETE_AGAIN_STORAGE_KEY, TCrud } from '../../models';
import { mapDtoToRecord, mapRecordToDto } from '../../utils';
import { CacheService } from '../cache/cache.service';
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
		this.queryParamsSubject.next(params);
	}
}
