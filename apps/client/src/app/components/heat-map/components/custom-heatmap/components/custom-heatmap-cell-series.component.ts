/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { DataItem, escapeLabel, formatLabel, NgxChartsModule, PlacementTypes, Series, StyleTypes } from '@swimlane/ngx-charts';
import { CustomHeatMapCellComponent } from './custom-heatmap-cell.component';
import { hashObject } from '@arndwestermann/common';

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
	hash: string;
}
@Component({
	selector: 'g[dp-custom-heat-map-cell-series]',
	imports: [CustomHeatMapCellComponent, NgxChartsModule],
	template: `
		@for (cell of cells; track cell.hash) {
			<svg:g
				dp-custom-heat-map-cell
				[x]="cell.x"
				[y]="cell.y"
				[width]="cell.width"
				[height]="cell.height"
				[fill]="cell.fill"
				[data]="cell.data"
				(select)="onClick(cell.cell)"
				(activate)="activate.emit(cell.cell)"
				(deactivate)="deactivate.emit(cell.cell)"
				[gradient]="gradient"
				[animations]="animations"
				ngx-tooltip
				[tooltipDisabled]="tooltipDisabled"
				[tooltipPlacement]="placementTypes.Top"
				[tooltipType]="styleTypes.tooltip"
				[tooltipTitle]="tooltipTemplate ? undefined : tooltipText(cell)"
				[tooltipTemplate]="tooltipTemplate"
				[tooltipContext]="{ series: cell.series, name: cell.label, value: cell.data }"></svg:g>
		}
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
		const width = this.xScale.bandwidth();
		const height = this.yScale.bandwidth();

		return this.data.flatMap((row: { name: string; series: { name: string; value: number }[] }) => {
			return row.series.map((cell) => {
				const tmp = {
					row,
					cell: { ...cell, series: row.name },
					x: this.xScale(row.name),
					y: this.yScale(cell.name),
					width,
					height,
					fill: this.colors.getColor(cell.value),
					data: cell.value,
					label: formatLabel(cell.name),
					series: row.name,
				};
				return { ...tmp, hash: hashObject(tmp) };
			});
		});
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
