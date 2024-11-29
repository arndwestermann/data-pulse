import { Component, ElementRef, OnChanges, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { select as d3Select } from 'd3-selection';
import { transition as d3Transition } from 'd3-transition';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'g[dp-custom-heat-map-cell]',
	standalone: true,
	template: `
		<svg:g [attr.transform]="transform()" class="cell" (click)="select.emit(data())">
			<svg:rect
				[attr.fill]="fill()"
				rx="3"
				[attr.stroke]="'#000'"
				[attr.stroke-width]="isString() ? 1 : 0"
				[attr.width]="width()"
				[attr.height]="height()"
				class="cell" />
			<text
				class="select-none"
				[attr.x]="width() / 2"
				[attr.y]="height() / 2"
				[attr.fill]="textColor()"
				text-anchor="middle"
				dominant-baseline="central">
				{{ text() }}
			</text>
		</svg:g>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'(mouseenter)': 'this.activate.emit(this.data())',
		'(mouseleave)': 'this.deactivate.emit(this.data())',
	},
})
export class CustomHeatMapCellComponent implements OnChanges {
	public readonly fill = input.required<string>();
	public readonly x = input.required<number>();
	public readonly y = input.required<number>();
	public readonly width = input.required<number>();
	public readonly height = input.required<number>();
	public readonly gradient = input<boolean>(false);
	public readonly animations = input<boolean>(true);
	public readonly data = input.required<string | number>();

	public readonly select = output<string | number>();
	public readonly activate = output<string | number>();
	public readonly deactivate = output<string | number>();

	public readonly transform = computed(() => `translate(${this.x()}, ${this.y()})`);
	public readonly isString = computed(() => typeof this.data() === 'string');

	public readonly textColor = computed(() => {
		const data = this.data();
		if (typeof data === 'string') return '#000';

		return data >= 17 ? '#fff' : '#000';
	});

	public readonly text = computed(() => {
		const data = this.data();
		if (typeof data === 'string') return data.split(':')[1];

		return data;
	});

	element: HTMLElement;

	constructor(element: ElementRef) {
		this.element = element.nativeElement;

		// Kudos to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/16176#issuecomment-348095843
		d3Select.prototype.transition = d3Transition;
	}

	ngOnChanges(): void {
		if (this.animations()) {
			this.loadAnimation();
		}
	}

	loadAnimation(): void {
		const node = d3Select(this.element).select('.cell');
		node.attr('opacity', 0);
		this.animateToCurrentForm();
	}

	animateToCurrentForm(): void {
		const node = d3Select(this.element).select('.cell');

		node.transition().duration(750).attr('opacity', 1);
	}
}
