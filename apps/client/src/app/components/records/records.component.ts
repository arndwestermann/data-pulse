import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TuiButton, TuiDialogService, TuiIcon } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { DatePipe, NgClass } from '@angular/common';

import {
	CSV_DATA_SEPARATOR,
	CSV_LINE_SEPARATOR,
	DATA_STORAGE_KEY,
	IRecord,
	NEVER_ASK_DELETE_AGAIN_STORAGE_KEY,
	Specialty,
} from '../../shared/models';
import { fromCache, getStatus, parseCSV, uuid as getUUID } from '../../shared/utils';

import { map, tap } from 'rxjs';

import { RecordFormComponent } from './components/record-form/record-form.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmDeleteComponent } from './components/confirm-delete/confirm-delete.component';
import { toSignal } from '@angular/core/rxjs-interop';

const angularImports = [NgClass, DatePipe];
const taigaUiImports = [TuiButton, TuiIcon, TuiTable];
const thirdPartyImports = [TranslocoDirective];
@Component({
	selector: 'dp-records',
	imports: [...angularImports, ...taigaUiImports, ...thirdPartyImports],
	template: `
		<div class="flex flex-shrink-0 space-x-2">
			<button type="button" tuiButton appearance="primary" size="s" (click)="openDialog()">
				<tui-icon icon="@tui.fa.solid.plus" />
			</button>
			<button type="button" tuiButton appearance="primary" size="s" (click)="fileInput.click()">
				<tui-icon icon="@tui.fa.solid.upload" />
			</button>
			<input #fileInput class="hidden" type="file" accept=".csv" [multiple]="false" (change)="importFile($event)" />
		</div>
		<div class="grow overflow-y-auto">
			<table tuiTable class="w-full" [columns]="columns()">
				<thead *transloco="let transloco; prefix: 'records'">
					<tr tuiThGroup>
						@for (column of columns(); track column) {
							<th *tuiHead="column" tuiTh [sorter]="null" [sticky]="true">
								{{ transloco(column) }}
							</th>
						}
					</tr>
				</thead>
				<tbody tuiTbody [data]="sortedData()" class="group" *transloco="let transloco; prefix: 'specialty'">
					@for (item of sortedData(); track $index) {
						<tr tuiTr (click)="openDialog(item)" [ngClass]="item.status">
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
										(click)="deleteRecord($event, item.uuid)"></button>
								</div>
							</td>
						</tr>
					}
				</tbody>
			</table>
		</div>
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
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsComponent {
	private readonly dialogService = inject(TuiDialogService);

	private readonly translocoService = inject(TranslocoService);
	private readonly data = fromCache<IRecord[]>(DATA_STORAGE_KEY, []);

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

	public readonly sortedData = computed(() => this.data().sort((a, b) => a.arrival.getTime() - b.arrival.getTime()));
	public readonly neverAskAgain = fromCache<boolean>(NEVER_ASK_DELETE_AGAIN_STORAGE_KEY, false);
	public readonly columns = computed(() => ['id', 'arrival', 'leaving', 'from', 'to', 'specialty', 'actions']);

	public openDialog(record?: IRecord): void {
		this.dialogService
			.open<IRecord | null>(new PolymorpheusComponent(RecordFormComponent), {
				data: record ?? null,
				dismissible: true,
				size: 'm',
			})
			.pipe(
				tap((value) => {
					if (value)
						this.data.update((records) => {
							const existingRecord = records.find((record) => record.uuid === value.uuid);
							if (existingRecord) {
								const index = records.indexOf(existingRecord);
								return [...records.slice(0, index), value, ...records.slice(index + 1)];
							}

							return [...records, value];
						});
				}),
			)
			.subscribe();
	}

	public deleteRecord(event: Event, uuid: string): void {
		event.stopPropagation();

		if (this.neverAskAgain()) {
			this.removeRecord(uuid);
			return;
		}

		this.dialogService
			.open<{ delete: boolean; neverAskAgain: boolean }>(new PolymorpheusComponent(ConfirmDeleteComponent), {
				dismissible: true,
				size: 'm',
			})
			.pipe(
				tap((value) => {
					if (value.delete === true) this.removeRecord(uuid);
					if (value.neverAskAgain === true) this.neverAskAgain.set(true);
				}),
			)
			.subscribe();
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

			this.data.update((value) => value.concat(records));
		};

		fileReader.readAsText(file);
	}

	private removeRecord(uuid: string): void {
		this.data.update((records) => records.filter((record) => record.uuid !== uuid));
	}
}
