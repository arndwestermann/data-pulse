import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TuiButton, TuiHint, TuiIcon, TuiScrollable, TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { DatePipe, NgClass } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { CSV_DATA_SEPARATOR, CSV_LINE_SEPARATOR, IRecord, SPECIALTIES, Specialty } from '../../shared/models';
import { getStatus, parseCSV, uuid as getUUID } from '../../shared/utils';

import { combineLatest, map, of, switchMap } from 'rxjs';

import { RecordFormComponent } from './components/record-form/record-form.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmDeleteComponent } from './components/confirm-delete/confirm-delete.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppService, RecordService } from '../../shared/services';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TuiCheckbox, TuiDataListWrapper } from '@taiga-ui/kit';
import { TuiInputDateTimeModule, TuiInputTagModule, tuiInputTagOptionsProvider, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import { isEqual, isSameDay } from 'date-fns';
import { FilterSpecialtiesPipe } from './pipes';

const angularImports = [NgClass, FormsModule, ReactiveFormsModule, DatePipe, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport];
const firstPartyImports = [FilterSpecialtiesPipe];
const taigaUiImports = [
	TuiButton,
	TuiIcon,
	TuiTable,
	TuiHint,
	TuiCheckbox,
	TuiTextfield,
	TuiInputDateTimeModule,
	TuiTextfieldControllerModule,
	TuiInputTagModule,
	TuiDataListWrapper,
	TuiScrollable,
	TuiScrollbar,
];
const thirdPartyImports = [TranslocoDirective];
@Component({
	selector: 'dp-records',
	imports: [...angularImports, ...taigaUiImports, ...firstPartyImports, ...thirdPartyImports],
	template: `
		<div class="flex flex-shrink-0 space-x-2" *transloco="let transloco; prefix: 'general'">
			<button type="button" tuiButton appearance="primary" size="s" (pointerdown)="onPointerEvent($event)">
				<tui-icon icon="@tui.fa.solid.plus" />
			</button>
			<button type="button" tuiButton appearance="primary" size="s" (click)="fileInput.click()">
				<tui-icon icon="@tui.fa.solid.upload" />
			</button>
			<input #fileInput class="hidden" type="file" accept=".csv" [multiple]="false" (change)="importFile($event)" />
			<button
				type="button"
				tuiButton
				appearance="primary-destructive"
				size="s"
				(click)="deleteSelectedRecords(selections.selected)"
				[tuiHint]="transloco('deleteSelected')">
				<tui-icon icon="@tui.fa.solid.trash" />
				@if (selections.selected.length > 0) {
					<span>({{ selections.selected.length }})</span>
				}
			</button>
		</div>
		<tui-scrollbar class="grow" [hidden]="true">
			<cdk-virtual-scroll-viewport
				#viewport
				tuiScrollable
				appendOnly
				class="[block-size:80rem]"
				[itemSize]="57"
				[maxBufferPx]="500"
				[minBufferPx]="400">
				<table tuiTable class="w-full" [columns]="columns()">
					<thead *transloco="let transloco; prefix: 'records'">
						<tr tuiThGroup>
							@for (column of columns(); track column) {
								@if (column === 'select') {
									<th *tuiHead="'select'" tuiTh [sorter]="null" [sticky]="true" [style.top.px]="-(viewport.getOffsetToRenderedContentStart() || 0)">
										<div class="flex justify-center">
											<input
												tuiCheckbox
												type="checkbox"
												id="header"
												[ngModel]="sortedData().length > 0 && selections.selected.length === sortedData().length"
												[indeterminate]="selections.selected.length > 0 && selections.selected.length < sortedData().length"
												(ngModelChange)="selectAll($event)" />
										</div>
									</th>
								} @else {
									<th *tuiHead="column" tuiTh [sorter]="null" [sticky]="true" [style.top.px]="-(viewport.getOffsetToRenderedContentStart() || 0)">
										{{ transloco(column) }}
									</th>
								}
							}
						</tr>
						<tr tuiThGroup [formGroup]="filterForm">
							@for (column of columns(); track column) {
								@if (column === 'actions' || column === 'select') {
									<th *tuiHead="column" style="padding: 0;" tuiTh [sorter]="null" [sticky]="true"></th>
								} @else {
									<th *tuiHead="column" style="padding: 0;" tuiTh [sorter]="null" [sticky]="true">
										@if (column === 'arrival' || column === 'leaving') {
											<tui-input-date-time [formControlName]="column" [tuiTextfieldLabelOutside]="true" [tuiTextfieldCleaner]="true">
												<input tuiTextfieldLegacy placeholder="04.09.1971" />
											</tui-input-date-time>
										} @else if (column === 'specialty') {
											<tui-input-tag
												name="specialty"
												[formControlName]="column"
												tuiTextfieldSize="m"
												[rows]="1"
												(searchChange)="onInputTagSearchChanged($event)"
												[tuiTextfieldLabelOutside]="filterForm.controls.specialty.value.length > 0">
												{{ transloco(column) }}
												<tui-data-list-wrapper *tuiDataList [items]="mappedSpecialties() | filterSpecialties: filterForm.controls.specialty.value" />
											</tui-input-tag>
										} @else {
											<tui-textfield tuiTextfieldAppearance="search">
												<input tuiTextfield type="text" [formControlName]="column" [placeholder]="transloco(column)" />
											</tui-textfield>
										}
									</th>
								}
							}
						</tr>
					</thead>
					<tbody tuiTbody [data]="sortedData()" class="group" *transloco="let transloco; prefix: 'specialty'">
						<tr tuiTr (pointerdown)="onPointerEvent($event, item)" [ngClass]="item.status" *cdkVirtualFor="let item of sortedData()">
							<td *tuiCell="'id'" tuiTd>
								{{ item.id }}
							</td>
							<td *tuiCell="'arrival'" tuiTd>
								{{ item.arrival | date: 'short' : undefined : locale() }}
							</td>
							<td *tuiCell="'leaving'" tuiTd>
								{{ item.leaving | date: 'short' : undefined : locale() }}
							</td>
							<td *tuiCell="'from'" tuiTd>
								{{ item.from }}
							</td>
							<td *tuiCell="'to'" tuiTd>
								{{ item.to }}
							</td>
							<td *tuiCell="'specialty'" tuiTd>
								{{ transloco(item.specialty) }}
							</td>

							<td *tuiCell="'actions'" tuiTd>
								<div class="w-full h-full flex justify-center">
									<button
										appearance="flat-destructive"
										iconStart="@tui.fa.solid.trash"
										size="s"
										tuiIconButton
										type="button"
										(pointerdown)="deleteRecord($event, item)"></button>
								</div>
							</td>
							<td *tuiCell="'select'" tuiTd>
								<div class="flex justify-center">
									<input tuiCheckbox type="checkbox" [ngModel]="selections.isSelected(item)" (ngModelChange)="selections.toggle(item)" />
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</cdk-virtual-scroll-viewport>
		</tui-scrollbar>
	`,
	styles: `
		:host {
			@apply flex flex-col h-full p-4 space-y-4;
		}

		[tuiTh],
		[tuiTd] {
			border-inline-start: none;
			border-inline-end: none;
		}

		.error[tuiTr] td {
			@apply bg-slate-800 text-white;
		}

		.caution[tuiTr] td {
			@apply bg-orange-600;
		}

		.warning[tuiTr] td {
			@apply bg-amber-300;
		}

		[tuiTr][class*='error']:hover td {
			@apply bg-slate-950;
		}

		[tuiTr][class*='caution']:hover td {
			@apply bg-yellow-600;
		}

		[tuiTr][class*='warning']:hover td {
			@apply bg-yellow-600;
		}

		[tuiTr]:hover td {
			@apply bg-gray-200 cursor-pointer;
		}

		[tuiTable][data-size='s'] [tuiTitle] {
			flex-direction: row;
			gap: 0.375rem;
		}

		[tuiAppearance][data-appearance='search'] {
			@apply focus:outline-none;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		tuiInputTagOptionsProvider({
			tagStatus: 'primary',
		}),
	],
})
export class RecordsComponent {
	private readonly appService = inject(AppService);
	private readonly translocoService = inject(TranslocoService);
	private readonly recordService = inject(RecordService);

	private readonly records = toSignal(this.recordService.records$, { initialValue: [] });

	private readonly specialtyFilter = signal<string>('');

	private readonly specialtyTranslations$ = of(SPECIALTIES.map((specialty) => specialty as string)).pipe(
		switchMap((specialties) => {
			const translations$ = specialties.map((specialty) =>
				this.translocoService.selectTranslate<string>(`specialty.${specialty}`).pipe(map((translation) => ({ key: specialty, value: translation }))),
			);

			return combineLatest(translations$);
		}),
	);

	private readonly specialties = toSignal(this.specialtyTranslations$, { initialValue: [] });

	private readonly filteredSpecialties = computed(() => {
		const filter = this.specialtyFilter();
		if (!filter) return this.specialties();

		return this.specialties().filter((specialty) => specialty.value.toLowerCase().includes(filter.toLowerCase()));
	});

	public readonly mappedSpecialties = computed(() => this.filteredSpecialties().map((specialty) => specialty.value));

	public readonly filterForm = new FormGroup({
		id: new FormControl<string | null>(null),
		arrival: new FormControl<[TuiDay, TuiTime | null] | null>(null),
		leaving: new FormControl<[TuiDay, TuiTime | null] | null>(null),
		from: new FormControl<string | null>(null),
		to: new FormControl<string | null>(null),
		specialty: new FormControl<string[]>([], { nonNullable: true }),
	});

	public readonly filterFormChanged = toSignal(this.filterForm.valueChanges, { initialValue: this.filterForm.value });

	public readonly filteredData = computed(() => {
		const filter = this.filterFormChanged();
		const specialties = this.specialties();
		let records = this.records();

		if (filter.id) {
			const id = filter.id;
			records = records.filter((record) => record.id.includes(id));
		}
		if (filter.arrival && filter.arrival[0]) {
			const arrivalArray = filter.arrival;
			const arrival = new Date(
				arrivalArray[0].year,
				arrivalArray[0].month,
				arrivalArray[0].day,
				arrivalArray[1]?.hours ?? 0,
				arrivalArray[1]?.minutes ?? 0,
				arrivalArray[1]?.seconds ?? 0,
			);

			records = records.filter((record) => (arrivalArray[1] ? isEqual(record.arrival, arrival) : isSameDay(record.arrival, arrival)));
		}
		if (filter.leaving && filter.leaving[0]) {
			const arrivalArray = filter.leaving;
			const leaving = new Date(
				arrivalArray[0].year,
				arrivalArray[0].month,
				arrivalArray[0].day,
				arrivalArray[1]?.hours ?? 0,
				arrivalArray[1]?.minutes ?? 0,
				arrivalArray[1]?.seconds ?? 0,
			);

			records = records.filter((record) => (arrivalArray[1] ? isEqual(record.leaving, leaving) : isSameDay(record.leaving, leaving)));
		}
		if (filter.from) {
			const from = filter.from;
			records = records.filter((record) => record.from.includes(from));
		}
		if (filter.to) {
			const to = filter.to;
			records = records.filter((record) => record.to.includes(to));
		}
		if (filter.specialty && filter.specialty.length > 0) {
			const specialty = filter.specialty
				.map((specialty) => specialties.find((s) => s.value === specialty)?.key)
				.filter((specialty) => specialty !== undefined);
			records = records.filter((record) => specialty.includes(record.specialty));
		}

		return records;
	});

	public readonly selections = new SelectionModel<IRecord>(true, [], true, (left, right) => left.uuid === right.uuid);

	public readonly isLoading = toSignal(this.appService.isLoading$, { initialValue: false });

	public readonly locale = toSignal(
		this.translocoService.langChanges$.pipe(
			map((lang) => {
				let locale = 'en-GB';
				switch (lang) {
					case 'de':
						locale = 'de-DE';
						break;
					default:
						break;
				}

				return locale;
			}),
		),
		{ initialValue: this.translocoService.getActiveLang() },
	);

	public readonly sortedData = computed(() => this.filteredData().sort((a, b) => a.arrival.getTime() - b.arrival.getTime()));
	public readonly columns = computed(() => ['id', 'arrival', 'leaving', 'from', 'to', 'specialty', 'actions', 'select']);

	protected readonly stringifySpecialty = (item: string): string => this.translocoService.translate(`specialty.${item}`);

	public onPointerEvent(event: PointerEvent, record?: IRecord): void {
		if (event.target instanceof HTMLInputElement) return;

		this.recordService.createOrUpdateRecord(new PolymorpheusComponent(RecordFormComponent), record ?? null);
	}

	public deleteRecord(event: Event, record: IRecord): void {
		event.stopPropagation();

		if (!record.uuid) return;

		this.recordService.deleteRecord(new PolymorpheusComponent(ConfirmDeleteComponent), record);
	}

	public importFile(event: Event) {
		const file = (event.target as HTMLInputElement).files?.item(0);

		if (!file) return;

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
				const uuid = getUUID();
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

				const status = getStatus(leaving, arrival);

				records.push({
					uuid: uuid,
					id: element.id,
					arrival,
					leaving,
					from: element.from,
					to: element.to,
					specialty: element.specialty as Specialty,
					status,
				});
			}

			this.recordService.addRecords(records);
		};

		fileReader.readAsText(file);
	}

	public deleteSelectedRecords(records: IRecord[]): void {
		if (records.length <= 0) return;

		this.recordService.deleteSelectedRecords(records);

		this.selections.clear();
	}

	public selectAll(selectAll: boolean): void {
		if (selectAll) this.selections.select(...this.sortedData());
		else this.selections.clear();
	}

	public onInputTagSearchChanged(search: string): void {
		this.specialtyFilter.update(() => search);
	}
}
