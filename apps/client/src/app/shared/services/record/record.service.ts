import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { filter, forkJoin, from, map, merge, of, scan, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { IRecord, IRecordDto, NEVER_ASK_DELETE_AGAIN_STORAGE_KEY, TCrud } from '../../models';
import { mapDtoToRecord, mapRecordToDto } from '../../utils';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { CacheService } from '../cache/cache.service';

@Injectable({
	providedIn: 'root',
})
export class RecordService {
	private readonly http = inject(HttpClient);
	private readonly dialogService = inject(TuiDialogService);
	private readonly cacheService = inject(CacheService);

	private readonly createOrUpdateRecordSubject = new Subject<{ component: PolymorpheusComponent<unknown>; record: IRecord | null }>();
	private readonly readRecordsSubject = new Subject<void>();
	private readonly createRecordsSubject = new Subject<IRecord[]>();
	private readonly deleteSelectedRecordsSubject = new Subject<IRecord[]>();
	private readonly deleteRecordSubject = new Subject<{ component: PolymorpheusComponent<unknown>; record: IRecord }>();

	private readonly createOrUpdateRecord$ = this.createOrUpdateRecordSubject.pipe(
		switchMap(({ component, record }) =>
			this.dialogService.open<IRecord>(component, { data: record, dismissible: true, size: 'm' }).pipe(map((record) => mapRecordToDto(record))),
		),
		switchMap((record) => {
			const request$ = record.uuid
				? this.http.patch<IRecordDto>(`${environment.baseUrl}/record/${record.uuid}`, record)
				: this.http.post<IRecordDto>(`${environment.baseUrl}/record`, record);

			return request$.pipe(map((dto) => ({ record: mapDtoToRecord(dto), isNew: !record.uuid })));
		}),
	);

	private readonly createRecords$ = this.createRecordsSubject.pipe(
		switchMap((records) => {
			const requests$ = records.map((record) => this.http.post<IRecordDto>(`${environment.baseUrl}/record`, mapRecordToDto(record)));
			return requests$.length ? forkJoin(requests$) : of([]);
		}),
		map((dtos) => dtos.map((dto) => mapDtoToRecord(dto))),
		switchMap((records) => from(records)),
	);

	// TODO: Implement pagination
	private readonly readRecords$ = this.readRecordsSubject.pipe(
		startWith(void 0),
		switchMap(() => this.http.get<IRecordDto[]>(`${environment.baseUrl}/record`)),
		map((dtos) => dtos.map((dto) => mapDtoToRecord(dto))),
	);

	private readonly deleteRecord$ = this.deleteRecordSubject.pipe(
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

	private readonly deleteSelectedRecords$ = this.deleteSelectedRecordsSubject.pipe(
		switchMap((records) => {
			const requests$ = records.map((record) => this.http.delete(`${environment.baseUrl}/record/${record.uuid}`));
			return requests$.length ? forkJoin(requests$).pipe(map(() => records)) : of([]);
		}),
		filter((records) => records.length > 0),
		switchMap((records) => from(records)),
	);

	private readonly recordsEvent$ = merge(
		this.createOrUpdateRecord$.pipe(
			map(({ record, isNew }) =>
				isNew ? ({ type: 'create', value: record } as TCrud<IRecord, 'create'>) : ({ type: 'update', value: record } as TCrud<IRecord, 'update'>),
			),
		),
		this.createRecords$.pipe(map((value) => ({ type: 'create', value }) as TCrud<IRecord, 'create'>)),
		this.readRecords$.pipe(map((value) => ({ type: 'read', value }) as TCrud<IRecord[], 'read'>)),
		this.deleteRecord$.pipe(map((value) => ({ type: 'delete', value }) as TCrud<IRecord, 'delete'>)),
		this.deleteSelectedRecords$.pipe(map((value) => ({ type: 'delete', value }) as TCrud<IRecord, 'delete'>)),
	);

	public readonly records$ = this.recordsEvent$.pipe(
		scan((state, event) => {
			switch (event.type) {
				case 'create':
					state = [...state, event.value];
					break;
				case 'read':
					state = [...event.value];
					break;
				case 'update': {
					const existingIndex = state.findIndex((record) => record.uuid === event.value.uuid);
					state[existingIndex] = event.value;
					state = [...state];
					break;
				}
				case 'delete':
					state = state.filter((businessPartner) => businessPartner.uuid !== event.value.uuid);
					break;

				default:
					break;
			}
			return state;
		}, [] as IRecord[]),
		shareReplay({ bufferSize: 1, refCount: true }),
	);

	public createOrUpdateRecord(component: PolymorpheusComponent<unknown>, record: IRecord | null) {
		this.createOrUpdateRecordSubject.next({ component, record });
	}
	public deleteRecord(component: PolymorpheusComponent<unknown>, record: IRecord) {
		this.deleteRecordSubject.next({ component, record });
	}

	public addRecords(records: IRecord[]) {
		this.createRecordsSubject.next(records);
	}

	public deleteSelectedRecords(records: IRecord[]) {
		this.deleteSelectedRecordsSubject.next(records);
	}
}
