import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, isDevMode, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IRecord, SPECIALTIES } from '../../shared/models';
import { startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { TuiInputDateRangeModule } from '@taiga-ui/legacy';
import { FormsModule } from '@angular/forms';
import { TuiDayRange, TuiDay } from '@taiga-ui/cdk';
import { DatePipe, KeyValue } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { TuiButton, TuiDialogService, TuiIcon } from '@taiga-ui/core';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';
import { HeatmapDetailDialogComponent } from './components/heatmap-detail-dialog/heatmap-detail-dialog.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { IHeatmapDetailDialogContext } from './models/heatmap-detail-dialog.model';
import { CustomHeatmapComponent } from './components/custom-heatmap/custom-heatmap.component';
import { RecordService } from '../../shared/services';
import { IHeatMap } from './models/heat-map.model';
import { fromWorker } from '@arndwestermann/observable-webworker';

interface IHeatmapChartData<T> {
	name: string;
	series: IHeatmapSeries<T>[];
}

interface IHeatmapSeries<T> {
	name: string;
	data: T;
	value: string | number;
}

@Component({
	selector: 'dp-heat-map',
	imports: [FormsModule, TuiInputDateRangeModule, TuiButton, TuiIcon, TranslocoDirective, CustomHeatmapComponent],
	template: `
		<ng-container *transloco="let transloco">
			<div class="flex flex-col justify-center h-full grow overflow-y-auto overflow-x-hidden">
				<div class="flex gap-2 items-center" data-html2canvas-ignore>
					<tui-input-date-range [(ngModel)]="dateRange" (ngModelChange)="onDateRangeChanged($event)" class="w-64">
						{{ transloco('heatmap.chooseRange') }}
						<input placeholder="From - To" tuiTextfieldLegacy />
					</tui-input-date-range>
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
	private readonly recordService = inject(RecordService);

	private readonly data = toSignal(this.recordService.records$, { initialValue: [] });
	private readonly hostElement = inject(ElementRef<HTMLElement>);
	private readonly translocoService = inject(TranslocoService);

	private readonly dateRangeSubject = new BehaviorSubject(this.initialDateRange());
	private readonly dateRange$ = this.dateRangeSubject.pipe(
		map((range) => ({
			from: new Date(range.from.year, range.from.month, range.from.day, 0, 0, 0),
			to: new Date(range.to.year, range.to.month, range.to.day, 23, 59, 59),
		})),
	);

	private readonly workerInput$ = combineLatest([this.recordService.records$, this.dateRange$]).pipe(
		map(([records, { from, to }]) => ({ records, from, to })),
	);
	private readonly heatmap$ = fromWorker<{ records: IRecord[]; from: Date; to: Date }, IHeatMap[]>(
		() => new Worker(new URL('./heatmap.worker', import.meta.url), { type: 'module' }),
		this.workerInput$,
	).pipe(shareReplay({ bufferSize: 1, refCount: true }));

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

	public readonly dateRange = signal<TuiDayRange>(this.initialDateRange());

	public readonly heatMap = toSignal(this.heatmap$, { initialValue: [] });

	public readonly admissions = computed(() =>
		this.heatMap().map((heatMapItem) => ({ key: heatMapItem.key, value: this.data().filter((item) => isSameDay(item.arrival, heatMapItem.key)) })),
	);

	public readonly discharge = computed(() =>
		this.heatMap().map((heatMapItem) => ({
			key: heatMapItem.key,
			value: this.data().filter((item) => item.leaving && isSameDay(item.leaving, heatMapItem.key)),
		})),
	);

	public readonly chart = computed(() => {
		const heatmap = this.heatMap();
		const admissions = this.admissions();
		const discharges = this.discharge();
		const admissionsTranslation = this.translocoService.translate('heatmap.admissions');
		const dischargesTranslation = this.translocoService.translate('heatmap.discharges');

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
	});

	public readonly groupedBySpecialty = computed(() => {
		const hashMap = new Map<string, number>();
		const start = new Date(this.dateRange().from.year, this.dateRange().from.month, this.dateRange().from.day, 0, 0, 0);
		const end = new Date(this.dateRange().to.year, this.dateRange().to.month, this.dateRange().to.day, 23, 59, 59);

		const filteredData = this.data().filter((record) =>
			isWithinInterval(record.arrival, {
				start,
				end,
			}),
		);

		for (const specialty of SPECIALTIES) {
			hashMap.set(specialty, 0);
		}

		for (const record of filteredData) {
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

	public openDialog(event: { name: string; value: string | number; label: string; series: string; data: Date }): void {
		if (typeof event.value === 'string' && event.value.includes('data')) return;

		const records = this.heatMap().find((item) => item.key === event.data)?.value[+event.series.split(':')[0]] ?? [];
		const context: IHeatmapDetailDialogContext = {
			day: event.data,
			records: records.map((record) => record.uuid).filter((uuid) => uuid !== undefined),
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
		this.dateRangeSubject.next(event);
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
			const text =
				new DatePipe(locale).transform(
					new Date(this.dateRange().from.year, this.dateRange().from.month, this.dateRange().from.day, 0, 0, 0),
					'MMMM yyyy',
				) ?? 'Heatmap';

			pdf.setFontSize(12);
			pdf.text(text, pdfWidth / 2, 5);
			pdf.save('heatmap.pdf');
		});
	}

	private initialDateRange(): TuiDayRange {
		const now = startOfMonth(new Date());
		const end = endOfMonth(now);

		return new TuiDayRange(
			new TuiDay(now.getFullYear(), now.getMonth(), now.getDate()),
			new TuiDay(end.getFullYear(), end.getMonth(), end.getDate()),
		);
	}
}
