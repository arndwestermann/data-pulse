/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { DataItem, escapeLabel, formatLabel, NgxChartsModule, PlacementTypes, Series, StyleTypes } from '@swimlane/ngx-charts';
import { CustomHeatMapCellComponent } from './custom-heatmap-cell.component';

interface Cell {
	cell: DataItem;
	data: number;
	fill: string;
	height: number;
	label: string;
	row: Series;
	series: string;
	width: number;
	x: number;
	y: number;
}
@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'g[dp-custom-heat-map-cell-series]',
	standalone: true,
	imports: [CustomHeatMapCellComponent, NgxChartsModule],
	template: `
		<svg:g
			dp-custom-heat-map-cell
			*ngFor="let c of cells; trackBy: trackBy"
			[x]="c.x"
			[y]="c.y"
			[width]="c.width"
			[height]="c.height"
			[fill]="c.fill"
			[data]="c.data"
			(select)="onClick(c.cell)"
			(activate)="activate.emit(c.cell)"
			(deactivate)="deactivate.emit(c.cell)"
			[gradient]="gradient"
			[animations]="animations"
			ngx-tooltip
			[tooltipDisabled]="tooltipDisabled"
			[tooltipPlacement]="placementTypes.Top"
			[tooltipType]="styleTypes.tooltip"
			[tooltipTitle]="tooltipTemplate ? undefined : tooltipText(c)"
			[tooltipTemplate]="tooltipTemplate"
			[tooltipContext]="{ series: c.series, name: c.label, value: c.data }"></svg:g>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomHeatCellSeriesComponent implements OnChanges, OnInit {
	@Input() data!: any;
	@Input() colors!: any;
	@Input() xScale!: any;
	@Input() yScale!: any;
	@Input() gradient!: boolean;
	@Input() tooltipDisabled = false;
	@Input() tooltipText!: any;
	@Input() tooltipTemplate!: TemplateRef<any>;
	@Input() animations = true;

	@Output() select: EventEmitter<DataItem> = new EventEmitter();
	@Output() activate: EventEmitter<DataItem> = new EventEmitter();
	@Output() deactivate: EventEmitter<DataItem> = new EventEmitter();

	cells!: Cell[];

	placementTypes = PlacementTypes;
	styleTypes = StyleTypes;

	ngOnInit() {
		if (!this.tooltipText) {
			this.tooltipText = this.getTooltipText;
		}
	}

	ngOnChanges(): void {
		this.update();
	}

	update(): void {
		this.cells = this.getCells();
	}

	getCells(): Cell[] {
		const cells: Cell[] = [];

		this.data.map((row: any) => {
			row.series.map((cell: any) => {
				const value = cell.value;
				cell.series = row.name;

				cells.push({
					row,
					cell,
					x: this.xScale(row.name),
					y: this.yScale(cell.name),
					width: this.xScale.bandwidth(),
					height: this.yScale.bandwidth(),
					fill: this.colors.getColor(value),
					data: value,
					label: formatLabel(cell.name),
					series: row.name,
				});
			});
		});

		return cells;
	}

	getTooltipText({ label, data, series }: { label: string; data: number; series: string }): string {
		return `
        <span class="tooltip-label">${escapeLabel(series)} • ${escapeLabel(label)}</span>
        <span class="tooltip-val">${data.toLocaleString()}</span>
      `;
	}

	trackBy(index: number, item: any): string {
		return item.label;
	}

	onClick(data: DataItem): void {
		this.select.emit(data);
	}
}
