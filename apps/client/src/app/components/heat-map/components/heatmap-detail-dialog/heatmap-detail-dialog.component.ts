import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TuiAppearance, TuiDialogContext, TuiTitle } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT, PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { IHeatmapDetailDialogContext } from '../../models/heatmap-detail-dialog.model';
import { RecordService } from '../../../../shared/services';
import { IRecord } from '../../../../shared/models';
import { RecordFormComponent } from '../../../../shared/components';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
	selector: 'dp-heatmap-detail-dialog',
	imports: [DatePipe, TuiCardLarge, TuiAppearance, TuiHeader, TuiTitle],
	template: `
		<header tuiHeader>
			<h2 tuiTitle>{{ context.data.day | date: 'longDate' : undefined : context.data.locale }}</h2>
		</header>
		@for (item of mappedRecords(); track $index) {
			<button tuiCardLarge tuiAppearance="floating" type="button" class="hover:cursor-pointer" (pointerdown)="editRecord(item)">
				<h1 tuiTitle>
					{{ item.id }}
					<span tuiSubtitle
						>{{ item.arrival | date: 'short' : undefined : context.data.locale }} -
						{{ item.leaving | date: 'short' : undefined : context.data.locale }}</span
					>
				</h1>
			</button>
		}
	`,
	styles: `
		@reference '../../../../../styles.css';

		:host {
			@apply flex flex-col gap-6 overflow-y-auto p-2 px-4 h-[600px];
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapDetailDialogComponent {
	private readonly recordService = inject(RecordService);

	private readonly records = toSignal(this.recordService.records$, { initialValue: [] });

	public readonly context = inject<TuiDialogContext<unknown, IHeatmapDetailDialogContext>>(POLYMORPHEUS_CONTEXT);

	public mappedRecords = computed(() => this.records().filter((record) => this.context.data.records.includes(record.uuid ?? '')));

	public editRecord(record: IRecord): void {
		this.recordService.createOrUpdateRecord(new PolymorpheusComponent(RecordFormComponent), record);
	}
}
