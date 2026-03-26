import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, isDevMode, linkedSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { IRecord, SPECIALTIES } from '../../shared/models';
import { startOfMonth, endOfMonth, isSameDay, startOfToday } from 'date-fns';
import { FormsModule } from '@angular/forms';
import { TuiDayRange } from '@taiga-ui/cdk';
import { DatePipe, KeyValue } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { parse as parseQueryParams, stringify as stringifyQueryParams } from 'qs';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { TuiButton, TuiDialogService, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { map, shareReplay, take, tap } from 'rxjs';
import { HeatmapDetailDialogComponent } from './components/heatmap-detail-dialog/heatmap-detail-dialog.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { IHeatmapDetailDialogContext } from './models/heatmap-detail-dialog.model';
import { CustomHeatmapComponent } from './components/custom-heatmap/custom-heatmap.component';
import { TuiInputDateRange } from '@taiga-ui/kit';
import { ActivatedRoute, Router } from '@angular/router';
import {
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	FilterCondition,
	FilterInput,
	formatDateString,
	IQueryOptions,
	isFilterCondition,
	parseDateString,
} from '@arndwestermann/common';
import { toNativeDateTime, toTuiDay } from '../../shared/utils';
import { form } from '@angular/forms/signals';
import { HeatMapService } from '../../shared/services/heat-map/heat-map.service';

interface IHeatmapChartData<T> {
	name: string;
	series: IHeatmapSeries<T>[];
}

interface IHeatmapSeries<T> {
	name: string;
	data: T;
	value: string | number;
}

const angularImports = [FormsModule];
const taigaUiImports = [TuiTextfield, TuiInputDateRange, TuiButton, TuiIcon];
const firstPartyImports = [CustomHeatmapComponent];
const thirdPartyImports = [TranslocoDirective];

@Component({
	selector: 'dp-heat-map',
	imports: [...angularImports, ...taigaUiImports, ...firstPartyImports, ...thirdPartyImports],
	template: `
		<ng-container *transloco="let transloco">
			<div class="flex flex-col justify-center h-full grow overflow-y-auto overflow-x-hidden">
				<div class="flex gap-2 items-center" data-html2canvas-ignore>
					<tui-textfield class="w-64" [tuiTextfieldCleaner]="false">
						<label tuiLabel> {{ transloco('general.chooseRange') }}</label>
						<input
							tuiInputDateRange
							[placeholder]="transloco('general.fromTo')"
							[ngModel]="filterForm.range().value()"
							(ngModelChange)="onDateRangeChanged($event)" />
						<tui-calendar-range *tuiTextfieldDropdown />
					</tui-textfield>
					<button type="button" tuiButton appearance="primary" size="m" (click)="print()">
						<tui-icon icon="@tui.fa.solid.download" />
					</button>
				</div>
				<div class="grow">
					<dp-custom-heatmap
						[legend]="false"
						[gradient]="false"
						[showXAxisLabel]="false"
						[showYAxisLabel]="false"
						[tooltipDisabled]="true"
						[xAxis]="true"
						[yAxis]="true"
						[innerPadding]="3"
						[animations]="false"
						[results]="chart()"
						(select)="openDialog($event)" />
					<!--
						(activate)="onActivate($event)"
						(deactivate)="onDeactivate($event)" -->
				</div>
			</div>

			<div class="flex flex-col shrink-0 gap-2 items-center justify-center">
				<div class="flex flex-col items-center gap-2">
					<span class="font-bold">{{ transloco('heatmap.specialty') }}</span>
					<div class="flex flex-col">
						@for (specialty of groupedBySpecialty(); track $index) {
							<div class="flex items-center w-max border border-b-0 border-black ">
								<span class="w-28 font-bold p-2 border-r border-black">{{ transloco('specialty.' + specialty.key) }}</span>
								<div class="flex items-center justify-center h-full w-10 ">
									{{ specialty.value }}
								</div>
							</div>
						}

						<div class="flex items-center w-max border border-black">
							<span class="w-28 font-bold p-2 border-r border-black">{{ transloco('heatmap.total') }}</span>
							<div class="flex items-center justify-center h-full w-10 font-bold">
								{{ sumSpecialty() }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</ng-container>
	`,
	styles: `
		@reference '../../../styles.css';

		:host {
			@apply flex gap-2 justify-center items-center p-2 h-full;
			box-shadow: unset !important;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatMapComponent {
	private readonly dialogService = inject(TuiDialogService);
	private readonly heatmapService = inject(HeatMapService);
	private readonly activatedRoute = inject(ActivatedRoute);
	private readonly router = inject(Router);

	private readonly hostElement = inject(ElementRef<HTMLElement>);
	private readonly translocoService = inject(TranslocoService);

	private readonly queryParams$ = this.activatedRoute.queryParams.pipe(
		tap((value) => this.heatmapService.setQueryParams(value)),
		map((value) => {
			const queryParamsString = stringifyQueryParams(value, { addQueryPrefix: true });
			const parsedQueryParams = parseQueryParams(queryParamsString, { ignoreQueryPrefix: true, interpretNumericEntities: true });
			const page = Number(parsedQueryParams['page']);
			const size = Number(parsedQueryParams['size']);
			return {
				page: !Number.isNaN(page) ? page : DEFAULT_PAGE,
				size: !Number.isNaN(size) ? size : DEFAULT_PAGE_SIZE,
				filters: parsedQueryParams['filters'] as Record<string, FilterInput>,
			} satisfies IQueryOptions as IQueryOptions;
		}),
		shareReplay(1),
		takeUntilDestroyed(),
	);

	private readonly queryParams = toSignal(this.queryParams$);

	public readonly filters = linkedSignal(() => {
		const range = this.queryParams()?.filters?.['range'];
		// TODO: Check on how to set default value, cause setting the value here doesn't trigger a request
		let parsedRange: TuiDayRange;

		if (isFilterCondition(range) && Array.isArray(range.value) && range.operator === 'between') {
			const start = startOfMonth(new Date());
			const from = toTuiDay(parseDateString(range.value[0]) ?? start);
			const to = toTuiDay(parseDateString(range.value[1]) ?? endOfMonth(start));

			parsedRange = new TuiDayRange(from, to);
		} else if (typeof range === 'string') {
			const from = parseDateString(range) ?? startOfToday();
			const to = endOfMonth(from);
			parsedRange = new TuiDayRange(toTuiDay(from), toTuiDay(to));
		} else {
			const start = startOfMonth(new Date());
			const from = toTuiDay(start);
			const to = toTuiDay(endOfMonth(start));

			parsedRange = new TuiDayRange(from, to);
		}

		return {
			range: parsedRange,
		};
	});

	private readonly heatmap$ = this.heatmapService.heatmap$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

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

	public readonly heatMap = toSignal(this.heatmap$, { initialValue: [] });

	public readonly chart = computed(() => {
		const heatmap = this.heatMap();
		const admissionsTranslation = this.translocoService.translate('heatmap.admissions');
		const dischargesTranslation = this.translocoService.translate('heatmap.discharges');

		return this.createChartData(heatmap, admissionsTranslation, dischargesTranslation);
	});

	public readonly groupedBySpecialty = computed(() => {
		const hashMap = new Map<string, number>();
		const heatmap = this.heatMap();

		const uniqueRecords = [...new Map(heatmap.flatMap((item) => item.value.flat()).map((record) => [record.uuid, record])).values()];

		for (const specialty of SPECIALTIES) {
			hashMap.set(specialty, 0);
		}

		for (const record of uniqueRecords) {
			const value = hashMap.get(record.specialty) ?? 0;
			hashMap.set(record.specialty, value + 1);
		}

		const array: KeyValue<string, number>[] = [];
		hashMap.forEach((value, key) => {
			array.push({ key, value });
		});

		return array;
	});

	public readonly sumSpecialty = computed(() => this.groupedBySpecialty().reduce((acc, curr) => acc + curr.value, 0));

	public readonly filterForm = form(this.filters);

	constructor() {
		this.queryParams$
			.pipe(
				take(1),
				tap((value) => this.heatmapService.setQueryParams(value)),
			)
			.subscribe();
	}

	public openDialog(event: { name: string; value: string | number; label: string; series: string; data: Date }): void {
		if (typeof event.value === 'string' && event.value.includes('data')) return;

		const records = this.heatMap().find((item) => item.key === event.data)?.value[+event.series.split(':')[0]] ?? [];
		const context: IHeatmapDetailDialogContext = {
			day: event.data,
			records,
			locale: this.locale(),
		};
		this.dialogService
			.open(new PolymorpheusComponent(HeatmapDetailDialogComponent), {
				data: context,
				size: 'l',
			})
			.subscribe();
	}

	public onDateRangeChanged(event: TuiDayRange): void {
		this.filterForm.range().value.set(event);
		this.onApplyFilter('range');
	}

	public print(): void {
		html2canvas(this.hostElement.nativeElement, { scale: 2, logging: isDevMode() }).then((canvas) => {
			const pdf = new jsPDF({ orientation: 'landscape', format: 'a4' });
			const imgData = canvas.toDataURL('image/png');

			// this.downloadURI(imgData, 'heatmap.png');
			const imgWidth = canvas.width;
			const imgHeight = canvas.height;

			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = pdf.internal.pageSize.getHeight();

			const aspectRatio = imgWidth / imgHeight;
			let pdfWidthToUse = pdfWidth;
			let pdfHeightToUse = pdfWidthToUse / aspectRatio || pdfHeight;

			if (pdfHeightToUse > pdfHeight) {
				pdfHeightToUse = pdfHeight;
				pdfWidthToUse = pdfHeightToUse * aspectRatio;
			}

			const x = (pdfWidth - pdfWidthToUse) / 2;
			const y = (pdfHeight - pdfHeightToUse) / 2;

			pdf.addImage(imgData, 'PNG', x, y, pdfWidthToUse, pdfHeightToUse);
			let locale = 'en-GB';
			switch (this.translocoService.getActiveLang()) {
				case 'de':
					locale = 'de-DE';
					break;
				default:
					break;
			}

			const range = this.filterForm.range().value();
			const text = new DatePipe(locale).transform(new Date(range.from.year, range.from.month, range.from.day, 0, 0, 0), 'MMMM yyyy') ?? 'Heatmap';
			const textOffset = pdf.getTextWidth(text) / 2;

			pdf.setFontSize(12);
			pdf.text(text, pdfWidth / 2 - textOffset, 5);
			pdf.save('heatmap.pdf');
		});
	}

	private createChartData(
		heatmap: KeyValue<Date, IRecord[][]>[],
		admissionsTranslation: string,
		dischargesTranslation: string,
	): IHeatmapChartData<Date>[] {
		const dailyStats = this.getDailyStats(heatmap);

		const admissions = dailyStats.map(({ date, admissions }) => ({
			key: date,
			value: admissions,
		}));

		const discharges = dailyStats.map(({ date, discharges }) => ({
			key: date,
			value: discharges,
		}));

		const chart: IHeatmapChartData<Date>[] = Array.from(
			{ length: 24 },
			(_, index) =>
				({
					name: `${index}:00`,
					series: [],
				}) satisfies IHeatmapChartData<Date>,
		);

		for (const element of heatmap.reverse()) {
			for (let i = 0; i < element.value.length; i++) {
				const hour = element.value[i];

				chart
					.find((item) => item.name === `${i}:00`)
					?.series.push({
						name: new DatePipe(this.locale()).transform(element.key, 'shortDate', this.locale()) ?? '',
						data: element.key,
						value: hour.length,
					});
			}
		}

		chart.push({
			name: admissionsTranslation,
			series: [],
		});
		chart.push({
			name: dischargesTranslation,
			series: [],
		});
		for (const element of admissions.reverse()) {
			chart
				.find((item) => item.name === admissionsTranslation)
				?.series?.push({
					name: new DatePipe(this.locale()).transform(element.key, 'shortDate', this.locale()) ?? '',
					data: element.key,
					value: `data:${element.value.length}`,
				});
		}
		for (const element of discharges.reverse()) {
			chart
				.find((item) => item.name === dischargesTranslation)
				?.series?.push({
					name: new DatePipe(this.locale()).transform(element.key, 'shortDate', this.locale()) ?? '',
					data: element.key,
					value: `data:${element.value.length}`,
				});
		}

		return chart;
	}

	public onApplyFilter(_: keyof ReturnType<typeof this.filters>) {
		const raw = this.filterForm().value();

		const filters: Record<string, FilterInput> = {};

		for (const _key of Object.keys(raw)) {
			const element = raw[_key as keyof typeof raw];
			if (Array.isArray(element)) {
				filters[_key] = formatDateString(toNativeDateTime(element[0], element[1]), 'dd.MM.yyyy HH:mm:ss');
			} else if (element instanceof TuiDayRange) {
				const start = element.from.toLocalNativeDate();
				const end = element.to.toLocalNativeDate();
				const value = [formatDateString(start, 'dd.MM.yyyy HH:mm:ss'), formatDateString(end, 'dd.MM.yyyy HH:mm:ss')];
				filters[_key] = { value, operator: 'between' } satisfies FilterCondition;
			} else {
				if (element) filters[_key] = element;
			}
		}

		const queryParams = stringifyQueryParams({ filters }, { addQueryPrefix: true });
		this.router.navigateByUrl(location.pathname + queryParams, { onSameUrlNavigation: 'ignore' });
	}

	private getDailyStats(entries: KeyValue<Date, IRecord[][]>[]) {
		return entries.map(({ key, value }) => {
			const allRecords = value.flat();
			const uniqueRecords = [...new Map(allRecords.map((r) => [r.uuid, r])).values()];

			const admissions = uniqueRecords.filter((r) => isSameDay(new Date(r.arrival), new Date(key)));

			const discharges = uniqueRecords.filter((r) => r.leaving && isSameDay(new Date(r.leaving), new Date(key)));

			return {
				date: key,
				admissions,
				discharges,
			};
		});
	}
}
