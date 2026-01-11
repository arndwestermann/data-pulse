import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
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

import { IPage } from '@arndwestermann/common';

import { stringify as stringifyQueryParams } from 'qs';
import { IRecord, IRecordDto, IWorker, NEVER_ASK_DELETE_AGAIN_STORAGE_KEY, TCrud } from '../../models';
import { mapDtoToRecord, mapRecordToDto } from '../../utils';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { CacheService } from '../cache/cache.service';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class RecordService {
	private readonly http = inject(HttpClient);
	private readonly dialogService = inject(TuiDialogService);
	private readonly cacheService = inject(CacheService);
	private readonly router = inject(Router);
	private readonly activatedRoute = inject(ActivatedRoute);

	private readonly worker = new Worker(new URL('./csv.worker', import.meta.url));

	private readonly createOrUpdateSubject = new Subject<{ component: PolymorpheusComponent<unknown>; record: IRecord | null }>();
	private readonly readSubject = new Subject<void>();
	private readonly deleteSelectedSubject = new Subject<IRecord[]>();
	private readonly deleteSubject = new Subject<{ component: PolymorpheusComponent<unknown>; record: IRecord }>();

	private readonly createOrUpdate$ = this.createOrUpdateSubject.pipe(
		switchMap(({ component, record }) =>
			this.dialogService
				.open<IRecord>(component, { data: record, dismissible: true, size: 'm' })
				.pipe(expand(() => (record ? EMPTY : this.dialogService.open<IRecord>(component, { data: record, dismissible: true, size: 'm' })))),
		),
		map((record) => mapRecordToDto(record)),
		switchMap((record) => {
			const request$ = record.uuid
				? this.http.patch<IRecordDto>(`${environment.baseUrl}/record/${record.uuid}`, record)
				: this.http.post<IRecordDto>(`${environment.baseUrl}/record`, record);

			return request$.pipe(map((dto) => ({ record: mapDtoToRecord(dto), isNew: !record.uuid })));
		}),
	);

	private readonly uploadImports$ = fromEvent<MessageEvent<IWorker<IRecord[]>>>(this.worker, 'message').pipe(
		filter((event) => event.data.message === 'csv'),
		map((event) => event.data.data),
		switchMap((records) => {
			const requests$ = records.map((record) => this.http.post<IRecordDto>(`${environment.baseUrl}/record`, mapRecordToDto(record)));
			return requests$.length ? forkJoin(requests$) : of([]);
		}),
		map((dtos) => dtos.map((dto) => mapDtoToRecord(dto))),
		switchMap((records) => from(records)),
	);

	private readonly read$ = combineLatest([this.readSubject.pipe(startWith(void 0)), this.activatedRoute.queryParams]).pipe(
		switchMap(([, queryParams]) => {
			const queryParamsString = stringifyQueryParams(queryParams, { addQueryPrefix: true });

			return this.http.get<IPage<IRecordDto[]>>(`${environment.baseUrl}/beta/record${queryParamsString}`);
		}),
		share(),
	);

	private readonly delete$ = this.deleteSubject.pipe(
		switchMap(({ component, record }) =>
			this.cacheService.load<boolean>(NEVER_ASK_DELETE_AGAIN_STORAGE_KEY).pipe(map((neverAskAgain) => ({ component, record, neverAskAgain }))),
		),
		switchMap(({ component, record, neverAskAgain }) => {
			const request$ = neverAskAgain
				? of({ delete: true, neverAskAgain })
				: this.dialogService.open<{ delete: boolean; neverAskAgain: boolean }>(component, { dismissible: true, size: 'm' });

			return request$.pipe(map(({ delete: deleteRecord, neverAskAgain }) => ({ delete: deleteRecord, record, neverAskAgain })));
		}),
		filter(({ delete: deleteRecord }) => deleteRecord),
		switchMap(({ record, neverAskAgain }) => this.cacheService.save(NEVER_ASK_DELETE_AGAIN_STORAGE_KEY, neverAskAgain).pipe(map(() => record))),
		switchMap((record) => this.http.delete(`${environment.baseUrl}/record/${record.uuid}`).pipe(map(() => record))),
	);

	private readonly deleteSelected$ = this.deleteSelectedSubject.pipe(
		switchMap((records) => {
			const requests$ = records.map((record) => this.http.delete(`${environment.baseUrl}/record/${record.uuid}`));
			return requests$.length ? forkJoin(requests$).pipe(map(() => records)) : of([]);
		}),
		filter((records) => records.length > 0),
		switchMap((records) => from(records)),
	);

	private readonly events$ = merge(
		this.createOrUpdate$.pipe(
			map(({ record, isNew }) =>
				isNew ? ({ type: 'create', value: record } as TCrud<IRecord, 'create'>) : ({ type: 'update', value: record } as TCrud<IRecord, 'update'>),
			),
		),
		this.uploadImports$.pipe(map((value) => ({ type: 'create', value }) as TCrud<IRecord, 'create'>)),
		this.read$.pipe(map((value) => ({ type: 'read', value: value.data.map((dto) => mapDtoToRecord(dto)) }) as TCrud<IRecord[], 'read'>)),
		this.delete$.pipe(map((value) => ({ type: 'delete', value }) as TCrud<IRecord, 'delete'>)),
		this.deleteSelected$.pipe(map((value) => ({ type: 'delete', value }) as TCrud<IRecord, 'delete'>)),
	);

	public readonly records$ = this.events$.pipe(
		scan((state, event) => {
			switch (event.type) {
				case 'create':
					state = [...state, event.value];
					break;
				case 'read':
					state = [...event.value];
					break;
				case 'update': {
					const existingIndex = state.findIndex((item) => item.uuid === event.value.uuid);
					state[existingIndex] = event.value;
					state = [...state];
					break;
				}
				case 'delete':
					state = state.filter((item) => item.uuid !== event.value.uuid);
					break;

				default:
					break;
			}
			return state;
		}, [] as IRecord[]),
		shareReplay({ bufferSize: 1, refCount: true }),
	);

	public readonly totalItems$ = this.read$.pipe(map((page) => page.totalItems));

	public createOrUpdateRecord(component: PolymorpheusComponent<unknown>, record: IRecord | null) {
		this.createOrUpdateSubject.next({ component, record });
	}
	public deleteRecord(component: PolymorpheusComponent<unknown>, record: IRecord) {
		this.deleteSubject.next({ component, record });
	}

	public importCsv(file: File) {
		this.worker.postMessage({ message: 'csv', data: file } satisfies IWorker<File>);
	}

	public deleteSelectedRecords(records: IRecord[]) {
		this.deleteSelectedSubject.next(records);
	}

	public getByRecordsId(id: string): Observable<IRecord | null> {
		return this.http.get<IRecordDto>(`${environment.baseUrl}/record/${id}`).pipe(
			map((dto) => mapDtoToRecord(dto)),
			catchError(() => of(null)),
		);
	}
}
