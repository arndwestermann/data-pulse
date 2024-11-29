import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TuiAppearance, TuiDialogContext, TuiTitle } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { IHeatmapDetailDialogContext } from '../../models/heatmap-detail-dialog.model';

@Component({
	selector: 'dp-heatmap-detail-dialog',
	standalone: true,
	imports: [DatePipe, TuiCardLarge, TuiAppearance, TuiHeader, TuiTitle],
	template: `
		<header tuiHeader>
			<h2 tuiTitle>{{ context.data.day | date: 'long' : undefined : context.data.locale }}</h2>
		</header>
		@for (item of context.data.records; track $index) {
			<button tuiCardLarge tuiAppearance="floating" type="button">
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
		:host {
			@apply flex flex-col space-y-6 overflow-y-auto p-2 px-4 h-[600px];
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapDetailDialogComponent {
	public readonly context = inject<TuiDialogContext<unknown, IHeatmapDetailDialogContext>>(POLYMORPHEUS_CONTEXT);
}
