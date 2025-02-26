import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	inject,
	input,
	model,
	output,
	PLATFORM_ID,
	signal,
	viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { DrawerComponent } from './drawer.component';

// Thanks to https://github.com/arkon/ng-sidebar

// Based on https://github.com/angular/material2/tree/master/src/lib/sidenav
@Component({
	selector: 'dp-drawer-container',
	imports: [],
	template: `
		@if (showBackdrop()) {
			<div aria-hidden="true" class="drawer__backdrop" [class]="backdropClass()" (click)="onBackdropClicked()"></div>
		}

		<ng-content select="dp-drawer,[dp-drawer]"></ng-content>
		<div #drawerContent class="drawer__content" [class.drawer__content--animate]="animate()" [class]="contentClass()" [style]="contentStyle()">
			<ng-content select="[drawer-content]"></ng-content>
		</div>
	`,
	styles: [
		`
			:host {
				box-sizing: border-box;
				display: block;
				position: relative;
				height: 100%;
				width: 100%;
				overflow: hidden;
			}

			.drawer__backdrop {
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				background: #000;
				opacity: 0.75;
				pointer-events: auto;
				z-index: 1;
			}

			.drawer__content {
				-webkit-overflow-scrolling: touch;
				overflow: auto;
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
			}

			.drawer__content--animate {
				-webkit-transition:
					-webkit-transform 0.3s cubic-bezier(0, 0, 0.3, 1),
					padding 0.3s cubic-bezier(0, 0, 0.3, 1);
				transition:
					transform 0.3s cubic-bezier(0, 0, 0.3, 1),
					padding 0.3s cubic-bezier(0, 0, 0.3, 1);
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerContainerComponent implements AfterContentInit {
	private readonly platformId = inject(PLATFORM_ID);
	private readonly cdr = inject(ChangeDetectorRef);

	private readonly isBrowser = signal<boolean>(isPlatformBrowser(this.platformId));
	private readonly drawers = signal<DrawerComponent[]>([]);

	private readonly resizeObserver: ResizeObserver = new ResizeObserver(() => {
		this.cdr.markForCheck();
	});

	private readonly drawerContent = viewChild.required<ElementRef<HTMLElement>>('drawerContent');

	public readonly location = input<string>();
	public readonly animate = input<boolean>(true);
	public readonly allowDrawerBackdropControl = input<boolean>(true);
	public readonly showBackdrop = model<boolean>(false);
	public readonly contentClass = input<string>('');
	public readonly backdropClass = input<string>('');

	public readonly backdropClicked = output<null>();

	public ngAfterContentInit(): void {
		if (!this.isBrowser()) return;

		this.toggleBackdrop();
		this.resizeObserver.observe(this.drawerContent().nativeElement);
	}

	/**
	 *
	 * Adds a drawer to the container's list of drawers.
	 *
	 * @param drawer {DrawerComponent} A drawer within the container to register.
	 */
	public addDrawer(drawer: DrawerComponent) {
		this.drawers.update((value) => [...value, drawer]);
		this.subscribeDrawerEvents(drawer);
	}

	/**
	 *
	 * Removes a drawer from the container's list of drawers.
	 *
	 * @param drawer {DrawerComponent} The drawer to remove.
	 */
	public removeDrawer(drawer: DrawerComponent) {
		const index = this.drawers().indexOf(drawer);
		if (index !== -1) {
			this.drawers.update((value) => value.splice(index, 1));
		}
	}

	/**
	 * @internal
	 *
	 * Computes `margin` value to push page contents to accommodate open drawers as needed.
	 *
	 * @return {CSSStyleDeclaration} margin styles for the page content.
	 */
	public contentStyle(): CSSStyleDeclaration {
		let left = 0,
			right = 0,
			top = 0,
			bottom = 0;

		let transformStyle = '';
		let heightStyle = '';
		let widthStyle = '';

		for (const drawer of this.drawers()) {
			const mode = drawer.mode();
			const opened = drawer.opened();
			const position = drawer.position();
			const isLeftOrRight = drawer.isLeftOrRight();
			const isLeftOrTop = drawer.isLeftOrTop();
			const width = drawer.getWidth();
			const height = drawer.getHeight();

			// Slide mode: we need to translate the entire container
			if (mode === 'slide') {
				if (opened) {
					const transformDir = isLeftOrRight ? 'X' : 'Y';
					const transformAmt = `${isLeftOrTop ? '' : '-'}${isLeftOrRight ? width : height}`;

					transformStyle = `translate${transformDir}(${transformAmt}px)`;
				}
			}

			// Create a space for the drawer
			if ((mode === 'push' && opened) || drawer.dock()) {
				let paddingAmt = 0;

				if (mode === 'slide' && opened) {
					if (isLeftOrRight) {
						widthStyle = '100%';
					} else {
						heightStyle = '100%';
					}
				} else {
					if (drawer.isDocked() || (mode === 'over' && drawer.dock())) {
						paddingAmt = drawer.dockedSizeNumber();
					} else {
						paddingAmt = isLeftOrRight ? width : height;
					}
				}

				switch (position) {
					case 'left':
						left = Math.max(left, paddingAmt);
						break;

					case 'right':
						right = Math.max(right, paddingAmt);
						break;

					case 'top':
						top = Math.max(top, paddingAmt);
						break;

					case 'bottom':
						bottom = Math.max(bottom, paddingAmt);
						break;
				}
			}
		}

		return {
			padding: `${top}px ${right}px ${bottom}px ${left}px`,
			webkitTransform: transformStyle,
			transform: transformStyle,
			height: heightStyle,
			width: widthStyle,
		} as CSSStyleDeclaration;
	}

	/**
	 * @internal
	 *
	 * Closes drawers when the backdrop is clicked, if they have the
	 * `closeOnClickBackdrop` option set.
	 */
	public onBackdropClicked(): void {
		let backdropClicked = false;
		for (const drawer of this.drawers()) {
			if (drawer.opened() && drawer.showBackdrop() && drawer.closeOnClickBackdrop()) {
				drawer.close();
				backdropClicked = true;
			}
		}

		if (backdropClicked) {
			this.backdropClicked.emit(null);
		}
	}

	/**
	 * Subscribes drawer events to react properly.
	 */
	private subscribeDrawerEvents(drawer: DrawerComponent): void {
		drawer.openStart.subscribe(() => this.toggleBackdrop());
		drawer.openEnd.subscribe(() => this.cdr.markForCheck());

		drawer.closeStart.subscribe(() => this.toggleBackdrop());
		drawer.closeEnd.subscribe(() => this.cdr.markForCheck());

		drawer.modeChange.subscribe(() => this.cdr.markForCheck());
		drawer.positionChange.subscribe(() => this.cdr.markForCheck());

		drawer.drawerRerendered.subscribe(() => this.cdr.markForCheck());
	}

	/**
	 * Check if we should show the backdrop when a drawer is toggled.
	 */
	private toggleBackdrop(): void {
		if (this.drawers().length > 0 && this.allowDrawerBackdropControl()) {
			// Show backdrop if a single open drawer has it set
			const hasOpen = this.drawers().some((drawer) => drawer.opened() && drawer.showBackdrop());

			this.showBackdrop.set(hasOpen);
		}
	}
}
