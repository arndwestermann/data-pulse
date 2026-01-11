import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
	TuiButton,
	TuiDataList,
	TuiDropdown,
	TuiDropdownDirective,
	TuiHint,
	TuiIcon,
	TuiScrollbar,
	tuiScrollbarOptionsProvider,
	TuiTextfield,
} from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';

import { IRecord, SPECIALTIES, RECORDS_MARKED_AS_CORRECT_STORAGE_KEY, DEFAULT_FIELDS } from '../../shared/models';
import { fromCache, toTuiDayTime, toNativeDateTime, toTuiMonth } from '../../shared/utils';

import { combineLatest, map, of, switchMap } from 'rxjs';

import { RecordFormComponent } from '../../shared/components';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmDeleteComponent } from './components/confirm-delete/confirm-delete.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppService, RecordService, UserService } from '../../shared/services';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
	TuiCheckbox,
	TuiDataListDropdownManager,
	TuiDataListWrapper,
	TuiFilterByInputPipe,
	TuiHideSelectedPipe,
	TuiInputChip,
	TuiInputDateTime,
	TuiInputMonth,
	TuiPagination,
} from '@taiga-ui/kit';
import { TuiDay, TuiMonth, TuiTime } from '@taiga-ui/cdk';
import { GetStatusPipe, MarkedAsCorrectPipe } from './pipes';
import { ActivatedRoute, Router } from '@angular/router';
import { parse as parseQueryParams, stringify as stringifyQueryParams } from 'qs';
import {
	DEFAULT_ORDER,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	FilterCondition,
	FilterInput,
	formatDateString,
	IField,
	IQueryOptions,
	isFilterCondition,
	parseDateString,
} from '@arndwestermann/common';
import { Field } from '@angular/forms/signals';
import { compatForm } from '@angular/forms/signals/compat';
import { endOfMonth, startOfMonth } from 'date-fns';

const angularImports = [FormsModule, ReactiveFormsModule, DatePipe, Field];
const firstPartyImports = [GetStatusPipe, MarkedAsCorrectPipe];
const taigaUiImports = [
	TuiButton,
	TuiIcon,
	TuiTable,
	TuiHint,
	TuiCheckbox,
	TuiTextfield,
	TuiInputDateTime,
	TuiInputChip,
	TuiDataListWrapper,
	TuiScrollbar,
	TuiDropdown,
	TuiDataList,
	TuiDataListDropdownManager,
	TuiFilterByInputPipe,
	TuiPagination,
	TuiHideSelectedPipe,
	TuiInputMonth,
];
const thirdPartyImports = [TranslocoDirective];
@Component({
	selector: 'dp-records',
	imports: [...angularImports, ...taigaUiImports, ...firstPartyImports, ...thirdPartyImports],
	template: `
		<ng-container *transloco="let transloco">
			<div class="flex shrink-0 gap-2">
				<button type="button" tuiButton appearance="primary" size="s" (pointerdown)="onPointerEvent($event)">
					<tui-icon icon="@tui.fa.solid.plus" />
				</button>

				@if (isAdmin()) {
					<button type="button" tuiButton appearance="primary" size="s" (click)="fileInput.click()">
						<tui-icon icon="@tui.fa.solid.upload" />
					</button>
				}

				<input #fileInput class="hidden" type="file" accept=".csv" [multiple]="false" (change)="importFile($event)" />
				<button
					type="button"
					tuiButton
					appearance="primary-destructive"
					size="s"
					(click)="deleteSelectedRecords(selections.selected)"
					[tuiHint]="transloco('general.deleteSelected')">
					<tui-icon icon="@tui.fa.solid.trash" />
					@if (selections.selected.length > 0) {
						<span>({{ selections.selected.length }})</span>
					}
				</button>

				<tui-textfield tuiTextfieldSize="s" class="w-40">
					<input
						[placeholder]="transloco('records.arrival')"
						tuiInputMonth
						[ngModel]="form.arrivalRange().value()"
						(ngModelChange)="onArrivalRangeChange($event)" />

					<tui-calendar-month *tuiTextfieldDropdown />
				</tui-textfield>
			</div>
			<tui-scrollbar class="grow">
				<table tuiTable class="w-full h-full" [columns]="columns()">
					<thead>
						<tr tuiThGroup>
							@for (column of columns(); track column) {
								@if (column === 'select') {
									<th *tuiHead="'select'" tuiTh [sorter]="null" [sticky]="true">
										<div class="flex justify-center">
											<input
												tuiCheckbox
												type="checkbox"
												id="header"
												[ngModel]="records().length > 0 && selections.selected.length === records().length"
												[indeterminate]="selections.selected.length > 0 && selections.selected.length < records().length"
												(ngModelChange)="selectAll($event)" />
										</div>
									</th>
								} @else {
									<th *tuiHead="column" tuiTh [sorter]="null" [sticky]="true">
										{{ transloco('records.' + column) }}
									</th>
								}
							}
						</tr>
						<tr tuiThGroup>
							@for (column of columns(); track column) {
								@if (column === 'actions' || column === 'select') {
									<th *tuiHead="column" style="padding: 0;" tuiTh [sorter]="null" [sticky]="true"></th>
								} @else {
									<th *tuiHead="column" style="padding: 0;" tuiTh [sorter]="null" [sticky]="true">
										@if (column === 'arrival' || column === 'leaving') {
											@let dateControl = column === 'arrival' ? form.arrival : form.leaving;
											<tui-textfield [tuiTextfieldCleaner]="true">
												<label tuiLabel> {{ transloco('records.' + column) }}</label>
												<input
													tuiInputDateTime
													placeholder="04.09.1971"
													[field]="dateControl"
													(keydown.enter)="onApplyFilter(column)"
													(input)="onInputClear($event, column)" />
												<tui-calendar *tuiTextfieldDropdown />
											</tui-textfield>
										} @else if (column === 'specialty') {
											<tui-textfield #input multi [rows]="1" [tuiTextfieldCleaner]="true" [disabledItemHandler]="disableNewTag">
												<input
													tuiInputChip
													[placeholder]="transloco('records.' + column)"
													[formControl]="form.specialty().control()"
													(keydown.enter)="onApplyFilter(column)"
													(input)="onInputClear($event, column)" />

												<tui-input-chip *tuiItem appearance="primary" />

												<tui-data-list-wrapper *tuiTextfieldDropdown new [items]="mappedSpecialties() | tuiHideSelected | tuiFilterByInput" />
											</tui-textfield>
										} @else {
											<tui-textfield tuiTextfieldAppearance="search" [tuiTextfieldCleaner]="true">
												<!--TODO: Find better solution to dynamically access form fields-->
												@let searchControl = $any(form)[column];
												<input
													tuiTextfield
													type="text"
													[field]="searchControl"
													[placeholder]="transloco('records.' + column)"
													(keydown.enter)="onApplyFilter($any(column))"
													(input)="onInputClear($event, $any(column))" />
											</tui-textfield>
										}
									</th>
								}
							}
						</tr>
					</thead>
					<tbody tuiTbody [data]="records()" class="group">
						@for (item of records(); track item.uuid) {
							@let isMarkedAsCorrect = item | markedAsCorrect: recordsMarkedAsCorrect();
							@let status = item | getStatus;

							<tr
								#row
								tuiTr
								(pointerdown)="onPointerEvent($event, item)"
								[class]="isMarkedAsCorrect ? null : status"
								#dropdown="tuiDropdown"
								tuiDropdownContext
								[tuiDropdown]="contextMenu">
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
									{{ transloco('specialty.' + item.specialty) }}
								</td>

								<td *tuiCell="'actions'" tuiTd>
									<div class="w-full h-full flex justify-center">
										<button
											appearance="flat-destructive"
											iconStart="@tui.fa.solid.trash"
											size="s"
											tuiIconButton
											type="button"
											(pointerdown.stop)="deleteRecord(item)"></button>
									</div>
								</td>
								<td *tuiCell="'select'" tuiTd>
									<div class="flex justify-center">
										<input tuiCheckbox type="checkbox" [ngModel]="selections.isSelected(item)" (ngModelChange)="selections.toggle(item)" />
									</div>
								</td>

								<ng-template #contextMenu>
									<tui-data-list role="menu" tuiDataListDropdownManager>
										@if (status !== null) {
											@if (isMarkedAsCorrect) {
												<button tuiOption new type="button" (click)="onConetextButtonClick(dropdown, 'markAsIncorrect', item)">
													{{ transloco('general.markAsIncorrect') }} <tui-icon icon="@tui.fa.solid.xmark" class="ml-2 w-4 text-red-500" />
												</button>
											} @else {
												<button tuiOption new type="button" (click)="onConetextButtonClick(dropdown, 'markAsCorrect', item)">
													{{ transloco('general.markAsCorrect') }} <tui-icon icon="@tui.fa.solid.check" class="ml-2 w-4 text-green-500" />
												</button>
											}
										}

										@let isSelected = selections.isSelected(item);
										@let icon = '@tui.fa.' + (isSelected ? 'regular' : 'solid') + '.square-check';

										<button tuiOption new type="button" (pointerdown)="onConetextButtonClick(dropdown, 'select', item)">
											{{ transloco('general.' + isSelected ? 'unselect' : 'select') }} <tui-icon [icon]="icon" class="ml-2 w-4 text-blue-500" />
										</button>

										<button tuiOption new type="button" (pointerdown)="onConetextButtonClick(dropdown, 'delete', item)">
											{{ transloco('general.delete') }} <tui-icon icon="@tui.fa.solid.trash" class="ml-2 w-4 text-red-500" />
										</button>
									</tui-data-list>
								</ng-template>
							</tr>
						}
					</tbody>
				</table>
			</tui-scrollbar>

			<div class="flex shrink-0 justify-center">
				<tui-pagination
					class="w-max bg-(--tui-background-base-alt) border rounded-lg px-2 py-1 z-10"
					[length]="pages()"
					[index]="page() - 1"
					[activePadding]="3"
					[sidePadding]="pages() > 9999 ? 0 : 1"
					(indexChange)="navigateToPage($event + 1)" />
			</div>
		</ng-container>
	`,
	styles: `
		@reference '../../../styles.css';

		:host {
			@apply flex flex-col h-full p-4 gap-4 relative;
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
			@apply focus:outline-hidden;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [tuiScrollbarOptionsProvider({ mode: 'hover' })],
})
export class RecordsComponent {
	private readonly appService = inject(AppService);
	private readonly router = inject(Router);
	private readonly activatedRoute = inject(ActivatedRoute);
	private readonly translocoService = inject(TranslocoService);
	private readonly recordService = inject(RecordService);
	private readonly userService = inject(UserService);

	private readonly fields = signal<IField[]>(DEFAULT_FIELDS);

	private readonly queryParams = toSignal(
		this.activatedRoute.queryParams.pipe(
			map((value) => {
				const queryParamsString = stringifyQueryParams(value, { addQueryPrefix: true });
				const parsedQueryParams = parseQueryParams(queryParamsString, { ignoreQueryPrefix: true, interpretNumericEntities: true });
				return {
					page: Number(parsedQueryParams['page']),
					size: Number(parsedQueryParams['size']),
					filters: parsedQueryParams['filters'] as Record<string, FilterInput>,
				} satisfies IQueryOptions as IQueryOptions;
			}),
		),
	);

	private readonly totalItems = toSignal(this.recordService.totalItems$, { initialValue: 1 });

	private readonly specialtyTranslations$ = of(SPECIALTIES.map((specialty) => specialty as string)).pipe(
		switchMap((specialties) => {
			const translations$ = specialties.map((specialty) =>
				this.translocoService.selectTranslate<string>(`specialty.${specialty}`).pipe(map((translation) => ({ key: specialty, value: translation }))),
			);

			return combineLatest(translations$);
		}),
	);

	private readonly specialties = toSignal(this.specialtyTranslations$, { initialValue: [] });

	public readonly mappedSpecialties = computed(() => this.specialties().map((specialty) => specialty.value));
	public readonly records = toSignal(this.recordService.records$, { initialValue: [] });

	public readonly page = linkedSignal(() => {
		const value = this.queryParams()?.page;
		return Number.isNaN(value) || value === undefined ? DEFAULT_PAGE : value;
	});
	public readonly size = linkedSignal(() => {
		const value = this.queryParams()?.size;
		return Number.isNaN(value) || value === undefined ? DEFAULT_PAGE_SIZE : value;
	});
	public readonly order = linkedSignal(() => this.queryParams()?.order ?? DEFAULT_ORDER);
	public readonly filters = linkedSignal(() => {
		const arrival = this.queryParams()?.filters?.['arrival'];
		// TODO: Check on how to set default value, cause setting the value here doesn't trigger a request
		let arrivalRange: TuiMonth | null = null;
		let parsedArrival: [TuiDay, TuiTime] | null = null;
		if (isFilterCondition(arrival) && Array.isArray(arrival.value) && arrival.operator === 'between') {
			arrivalRange = toTuiMonth(parseDateString(arrival.value[0]) ?? undefined);
		} else if (typeof arrival === 'string') {
			parsedArrival = this.parseFilterDates(arrival);
		}

		const leaving = this.parseFilterDates(this.queryParams()?.filters?.['leaving']);
		const specialty =
			((this.queryParams()?.filters?.['specialty'] as FilterCondition | undefined)?.value as string[] | undefined)
				?.map((value) => this.specialties().find((specialty) => specialty.key === value)?.value)
				.filter((value) => value !== undefined) ?? [];

		const value = {
			id: (this.queryParams()?.filters?.['id'] as string | undefined) ?? null,
			arrivalRange,
			arrival: parsedArrival,
			leaving,
			from: (this.queryParams()?.filters?.['from'] as string | undefined) ?? null,
			to: (this.queryParams()?.filters?.['to'] as string | undefined) ?? null,
			specialty: new FormControl<string[]>(specialty),
		};
		return value;
	});

	public readonly isAdmin = toSignal(this.userService.isAdmin$, { initialValue: false });

	public readonly recordsMarkedAsCorrect = fromCache<string[]>(RECORDS_MARKED_AS_CORRECT_STORAGE_KEY, []);

	// TODO: Fix adding items to input chip
	protected readonly disableNewTag = (item: string): boolean =>
		!this.mappedSpecialties().find((specialty) => specialty.toLowerCase().includes(item.toLowerCase()));

	public readonly form = compatForm(this.filters);

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

	public readonly columns = computed(() => {
		const mapped = this.fields().map((field) => field.name);
		return [...mapped, 'actions', 'select'];
	});

	public readonly pages = computed(() => {
		const totalItems = this.totalItems();
		return totalItems > 0 ? Math.ceil(totalItems / this.size()) : 1;
	});

	protected readonly stringifySpecialty = (item: string): string => this.translocoService.translate(`specialty.${item}`);

	public onPointerEvent(event: PointerEvent, record?: IRecord): void {
		if (event.target instanceof HTMLInputElement || event.button === 2) return;

		this.recordService.createOrUpdateRecord(new PolymorpheusComponent(RecordFormComponent), record ?? null);
	}

	public deleteRecord(record: IRecord): void {
		if (!record.uuid) return;

		this.recordService.deleteRecord(new PolymorpheusComponent(ConfirmDeleteComponent), record);
	}

	public importFile(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		const file = fileInput.files?.item(0);

		if (!file) return;

		this.recordService.importCsv(file);
		fileInput.value = '';
	}

	public deleteSelectedRecords(records: IRecord[]): void {
		if (records.length <= 0) return;

		this.recordService.deleteSelectedRecords(records);

		this.selections.clear();
	}

	public selectAll(selectAll: boolean): void {
		if (selectAll) this.selections.select(...this.records());
		else this.selections.clear();
	}

	public onConetextButtonClick(dropdown: TuiDropdownDirective, event: 'markAsCorrect' | 'markAsIncorrect' | 'select' | 'delete', record: IRecord) {
		const uuid = record.uuid;
		if (!uuid) return;

		switch (event) {
			case 'markAsCorrect':
				this.recordsMarkedAsCorrect.update((value) => {
					const existing = value.find((item) => item === uuid);
					if (existing) return value;

					return [...value, uuid];
				});
				break;
			case 'markAsIncorrect':
				this.recordsMarkedAsCorrect.update((value) => value.filter((item) => item !== uuid));
				break;
			case 'select':
				this.selections.toggle(record);
				break;
			case 'delete':
				this.deleteRecord(record);
				break;
			default:
				break;
		}
		dropdown.toggle(false);
	}
	public navigateToPage(page: number): void {
		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams: { page },
			queryParamsHandling: 'merge',
		});
	}

	public onApplyFilter(_key: keyof ReturnType<typeof this.filters>) {
		const raw = this.form().value();

		const filters: Record<string, FilterInput> = {};

		for (const _key of Object.keys(raw)) {
			const element = raw[_key as keyof typeof raw];
			if (Array.isArray(element)) {
				filters[_key] = formatDateString(toNativeDateTime(element[0], element[1]), 'dd.MM.yyyy HH:mm:ss');
			} else if (element instanceof FormControl) {
				if ((element.value?.length ?? 0) > 0) {
					const value: FilterInput = {
						value: element.value
							?.map((specialty) => this.specialties().find((item) => item.value === specialty)?.key)
							.filter((value) => value !== undefined),
						operator: 'in',
					} satisfies FilterCondition;

					filters[_key] = value;
				}
			} else if (element instanceof TuiMonth) {
				const start = startOfMonth(element.toUtcNativeDate());
				const end = endOfMonth(start);
				const value = [formatDateString(start, 'dd.MM.yyyy HH:mm:ss'), formatDateString(end, 'dd.MM.yyyy HH:mm:ss')];
				filters['arrival'] = { value, operator: 'between' } satisfies FilterCondition;
			} else {
				if (element) filters[_key] = element;
			}
		}

		const queryParams = stringifyQueryParams({ page: this.page(), size: this.size(), filters }, { addQueryPrefix: true });
		this.router.navigateByUrl(location.pathname + queryParams, { onSameUrlNavigation: 'ignore' });
	}

	public onInputClear(event: Event, key: keyof ReturnType<typeof this.filters>) {
		if (!(event instanceof InputEvent) || event.inputType !== 'deleteContentBackward') return;

		this.form[key]().value.set(null);
		this.onApplyFilter('id');
	}

	public onArrivalRangeChange(event: TuiMonth | null) {
		this.form.arrivalRange().value.set(event);
		this.onApplyFilter('arrival');
	}

	private parseFilterDates(value?: unknown): [TuiDay, TuiTime] | null {
		if (value && typeof value === 'string') {
			const parsed = parseDateString(value);
			if (parsed) {
				return toTuiDayTime(parsed);
			}
		}

		return null;
	}
}
