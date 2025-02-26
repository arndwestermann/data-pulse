import {
	AfterContentInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	OnChanges,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	SimpleChanges,
	computed,
	inject,
	input,
	model,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { DrawerContainerComponent } from './drawer-container.component';
import { isLTR, isIOS } from './utils';

@Component({
	selector: 'dp-drawer',
	imports: [],
	template: `
		@let classOpen = ' drawer--' + (opened() ? 'opened' : 'closed');
		@let classPosition = ' drawer--' + position();
		@let classMode = ' drawer--' + mode();
		@let class = classOpen + classPosition + classMode + ' ';

		<aside
			#drawer
			role="complementary"
			[attr.aria-hidden]="!opened()"
			[attr.aria-label]="ariaLabel()"
			[class]="'drawer' + class + drawerClass()"
			[class.drawer--docked]="isDocked()"
			[class.drawer--inert]="isInert()"
			[class.drawer--animate]="animate()"
			[style]="getStyle()">
			<ng-content></ng-content>
		</aside>
	`,
	styles: [
		`
			.drawer {
				-webkit-overflow-scrolling: touch;
				overflow: auto;
				pointer-events: auto;
				position: absolute;
				touch-action: auto;
				will-change: initial;
				z-index: 2;
			}
			.drawer--left {
				bottom: 0;
				left: 0;
				top: 0;
			}
			.drawer--right {
				bottom: 0;
				right: 0;
				top: 0;
			}
			.drawer--top {
				left: 0;
				right: 0;
				top: 0;
			}
			.drawer--bottom {
				bottom: 0;
				left: 0;
				right: 0;
			}
			.drawer--inert {
				pointer-events: none;
				touch-action: none;
				will-change: transform;
			}
			.drawer--animate {
				-webkit-transition: -webkit-transform 0.3s cubic-bezier(0, 0, 0.3, 1);
				transition: transform 0.3s cubic-bezier(0, 0, 0.3, 1);
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerComponent implements AfterContentInit, OnInit, OnChanges, OnDestroy {
	private readonly container = inject(DrawerContainerComponent, { optional: true });
	private readonly platformId = inject(PLATFORM_ID);

	private readonly focusableElementsString = signal<string>(
		'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]',
	);
	private readonly focusableElements = signal<HTMLElement[]>([]);
	private readonly focusedBeforeOpen = signal<HTMLElement | null>(null);

	private readonly tabIndexAttr = signal<string>('__tabindex__');
	private readonly tabIndexIndicatorAttr = signal<string>('__drawer-tabindex__');

	private readonly wasCollapsed = signal<boolean>(false);

	// Delay initial animation (issues #59, #112)
	private readonly shouldAnimate = signal<boolean>(false);

	private readonly clickEvent = signal<string>('click');
	private readonly onClickOutsideAttached = signal<boolean>(false);
	private readonly onKeyDownAttached = signal<boolean>(false);
	private readonly onResizeAttached = signal<boolean>(false);

	private readonly isBrowser = signal<boolean>(isPlatformBrowser(this.platformId));

	private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');

	public readonly location = input<string>();
	public readonly opened = model(false);
	public readonly openedChange = output<boolean>();

	public readonly mode = input<'over' | 'push' | 'slide'>('over');
	public readonly dock = input<boolean>(false);
	public readonly dockedSize = input<string>('0px');
	public readonly position = model<'start' | 'end' | 'left' | 'right' | 'top' | 'bottom'>('left');
	public readonly animate = model<boolean>(true);

	public readonly autoCollapseHeight = input<number>(0);
	public readonly autoCollapseWidth = input<number>(0);
	public readonly autoCollapseOnInit = input<boolean>(true);

	public readonly drawerClass = input<string>('');

	public readonly ariaLabel = input<string>('');
	public readonly trapFocus = input<boolean>(false);
	public readonly autoFocus = input<boolean>(true);

	public readonly showBackdrop = input<boolean>(false);
	public readonly closeOnClickBackdrop = input<boolean>(false);
	public readonly closeOnClickOutside = input<boolean>(false);

	public readonly keyClose = input<boolean>(false);
	public readonly keyCode = input<string>('Escape'); // Default to ESC key

	public readonly contentInit = output();
	public readonly openStart = output();
	public readonly openEnd = output();
	public readonly closeStart = output();
	public readonly closeEnd = output();
	public readonly transitionEnd = output();
	public readonly modeChange = output<string>();
	public readonly positionChange = output<string>();
	public readonly drawerRerendered = output();

	/**
	 *
	 * Returns the docked size as a number.
	 *
	 * @return {number} Docked size.
	 */
	public readonly dockedSizeNumber = computed(() => parseFloat(this.dockedSize()));

	/**
	 *
	 * Returns whether the drawer is "docked" -- i.e. it is closed but in dock mode.
	 *
	 * @return {boolean} Drawer is docked.
	 */
	public readonly isDocked = computed(() => this.dock() && !!this.dockedSize() && !this.opened());

	/**
	 *
	 * Returns whether the drawer is positioned at the left or top.
	 *
	 * @return {boolean} Drawer is positioned at the left or top.
	 */
	public readonly isLeftOrTop = computed(() => this.position() === 'left' || this.position() === 'top');

	/**
	 *
	 * Returns whether the drawer is positioned at the left or right.
	 *
	 * @return {boolean} Drawer is positioned at the left or right.
	 */
	public readonly isLeftOrRight = computed(() => this.position() === 'left' || this.position() === 'right');

	/**
	 *
	 * Returns whether the drawer is inert -- i.e. the contents cannot be focused.
	 *
	 * @return {boolean} Drawer is inert.
	 */
	public readonly isInert = computed(() => !this.opened() && !this.dock());

	/**
	 *
	 * Computes the transform styles for the drawer template.
	 *
	 * @return {CSSStyleDeclaration} The transform styles, with the WebKit-prefixed version as well.
	 */
	public readonly getStyle = computed(() => {
		let transformStyle = '';
		const opened = this.opened();

		// Hides drawer off screen when closed
		if (!opened) {
			const transformDir: string = 'translate' + (this.isLeftOrRight() ? 'X' : 'Y');
			const translateAmt = `${this.isLeftOrTop() ? '-' : ''}100%`;

			transformStyle = `${transformDir}(${translateAmt})`;

			// Docked mode: partially remains open
			// Note that using `calc(...)` within `transform(...)` doesn't work in IE
			if (this.dock() && this.dockedSizeNumber() > 0 && !(this.mode() === 'slide' && this.opened())) {
				transformStyle += ` ${transformDir}(${this.isLeftOrTop() ? '+' : '-'}${this.dockedSize()})`;
			}
		}

		return {
			webkitTransform: transformStyle,
			transform: transformStyle,
		} as CSSStyleDeclaration;
	});

	constructor() {
		if (!this.container) {
			throw new Error('<dp-drawer> must be inside a <dp-drawer-container>.');
		}

		// Handle taps in iOS
		if (this.isBrowser() && isIOS() && !('onclick' in window)) {
			this.clickEvent.set('touchstart');
		}

		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.onTransitionEnd = this.onTransitionEnd.bind(this);
		this.onFocusTrap = this.onFocusTrap.bind(this);
		this.onClickOutside = this.onClickOutside.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.collapse = this.collapse.bind(this);
	}

	public ngOnInit(): void {
		if (!this.isBrowser()) return;

		if (this.animate()) {
			this.shouldAnimate.set(true);
			this.animate.set(false);
		}

		this.container?.addDrawer(this);

		if (this.autoCollapseOnInit()) {
			this.collapse();
		}
	}

	public ngAfterContentInit(): void {
		this.contentInit.emit();
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (!this.isBrowser()) return;

		if (changes['animate'] && this.shouldAnimate()) {
			this.shouldAnimate.set(changes['animate'].currentValue);
		}

		if (changes['closeOnClickOutside']) {
			if (changes['closeOnClickOutside'].currentValue) {
				this.initCloseClickListener();
			} else {
				this.destroyCloseClickListener();
			}
		}
		if (changes['keyClose']) {
			if (changes['keyClose'].currentValue) {
				this.initCloseKeyDownListener();
			} else {
				this.destroyCloseKeyDownListener();
			}
		}

		if (changes['position']) {
			// Handle "start" and "end" aliases
			this.normalizePosition();

			// Emit change in timeout to allow for position change to be rendered first
			setTimeout(() => {
				this.positionChange.emit(changes['position'].currentValue);
			});
		}

		if (changes['mode']) {
			setTimeout(() => {
				this.modeChange.emit(changes['mode'].currentValue);
			});
		}

		if (changes['dock']) {
			this.triggerRerender();
		}

		if (changes['opened']) {
			if (this.shouldAnimate()) {
				this.animate.set(true);
				this.shouldAnimate.set(false);
			}

			if (changes['opened'].currentValue) {
				this.open();
			} else {
				this.close();
			}
		}

		if (changes['autoCollapseHeight'] || changes['autoCollapseWidth']) {
			this.initCollapseListeners();
		}
	}

	public ngOnDestroy(): void {
		if (!this.isBrowser()) return;

		this.destroyCloseListeners();
		this.destroyCollapseListeners();

		this.container?.removeDrawer(this);
	}

	/**
	 *
	 * Returns the rendered width of the drawer (or the docked size).
	 * This is used in the drawer container.
	 *
	 * @return {number} Width of drawer.
	 */

	public getWidth(): number {
		const element = this.drawer();

		if (element?.nativeElement) {
			return this.isDocked() ? this.dockedSizeNumber() : element.nativeElement.offsetWidth;
		}

		return 0;
	}

	/**
	 *
	 * Returns the rendered height of the drawer (or the docked size).
	 * This is used in the drawer container.
	 *
	 * @return {number} Height of drawer.
	 */

	public getHeight(): number {
		const element = this.drawer();
		if (element?.nativeElement) {
			return this.isDocked() ? this.dockedSizeNumber() : element.nativeElement.offsetHeight;
		}

		return 0;
	}

	// Drawer toggling
	// ==============================================================================================

	/**
	 * Opens the drawer and emits the appropriate events.
	 */
	public open(): void {
		if (!this.isBrowser()) return;

		this.opened.set(true);
		this.openedChange.emit(true);

		this.openStart.emit();

		setTimeout(() => {
			if (this.animate() && this.mode() !== 'slide') {
				this.drawer()?.nativeElement.addEventListener('transitionend', this.onTransitionEnd);
			} else {
				this.setFocused();
				this.initCloseListeners();

				if (this.opened()) {
					this.openEnd.emit();
				}
			}
		});
	}

	/**
	 * Closes the drawer and emits the appropriate events.
	 */
	public close(): void {
		if (!this.isBrowser()) return;

		this.opened.set(false);
		this.openedChange.emit(false);

		this.closeStart.emit();

		setTimeout(() => {
			if (this.animate() && this.mode() !== 'slide') {
				this.drawer()?.nativeElement.addEventListener('transitionend', this.onTransitionEnd);
			} else {
				this.setFocused();
				this.destroyCloseListeners();

				if (!this.opened()) {
					this.closeEnd.emit();
				}
			}
		});
	}

	/**
	 * Manually trigger a re-render of the container. Useful if the drawer contents might change.
	 */
	private triggerRerender(): void {
		if (!this.isBrowser()) return;

		setTimeout(() => {
			this.drawerRerendered.emit();
		});
	}

	/**
	 *
	 * Handles the `transitionend` event on the drawer to emit the openEnd/closeEnd events after the transform
	 * transition is completed.
	 */
	private onTransitionEnd(event: TransitionEvent): void {
		if (event.target === this.drawer()?.nativeElement && event.propertyName.endsWith('transform')) {
			this.setFocused();

			if (this.opened()) {
				this.initCloseListeners();
				this.openEnd.emit();
			} else {
				this.destroyCloseListeners();
				this.closeEnd.emit();
			}

			this.transitionEnd.emit();

			this.drawer()?.nativeElement.removeEventListener('transitionend', this.onTransitionEnd);
		}
	}

	/**
	 * Sets focus to the first focusable element inside the drawer.
	 */
	private focusFirstItem(): void {
		if (this.focusableElements().length > 0) {
			this.focusableElements()[0].focus();
		}
	}

	/**
	 * Loops focus back to the start of the drawer if set to do so.
	 */
	private onFocusTrap(event: FocusEvent): void {
		const element = this.drawer();
		const shouldTrapFocus = this.opened() && this.trapFocus();
		if (shouldTrapFocus && element && event.target instanceof HTMLElement && !element.nativeElement.contains(event.target)) {
			this.focusFirstItem();
		}
	}

	/**
	 * Handles the ability to focus drawer elements when it's open/closed to ensure that the drawer is inert when
	 * appropriate.
	 */
	private setFocused(): void {
		const element = this.drawer();

		if (!element) return;

		this.focusableElements.set(Array.from(element.nativeElement.querySelectorAll(this.focusableElementsString())) as HTMLElement[]);

		if (this.opened()) {
			this.focusedBeforeOpen.set(document.activeElement as HTMLElement);

			// Restore focusability, with previous tabindex attributes
			for (const el of this.focusableElements()) {
				const prevTabIndex = el.getAttribute(this.tabIndexAttr());
				const wasTabIndexSet = el.getAttribute(this.tabIndexIndicatorAttr()) !== null;
				if (prevTabIndex !== null) {
					el.setAttribute('tabindex', prevTabIndex);
					el.removeAttribute(this.tabIndexAttr());
				} else if (wasTabIndexSet) {
					el.removeAttribute('tabindex');
					el.removeAttribute(this.tabIndexIndicatorAttr());
				}
			}

			if (this.autoFocus()) {
				this.focusFirstItem();
			}

			document.addEventListener('focus', this.onFocusTrap, true);
		} else {
			// Manually make all focusable elements unfocusable, saving existing tabindex attributes
			for (const el of this.focusableElements()) {
				const existingTabIndex = el.getAttribute('tabindex');
				el.setAttribute('tabindex', '-1');
				el.setAttribute(this.tabIndexIndicatorAttr(), '');

				if (existingTabIndex !== null) {
					el.setAttribute(this.tabIndexAttr(), existingTabIndex);
				}
			}

			document.removeEventListener('focus', this.onFocusTrap, true);

			const focusedBeforeOpen = this.focusedBeforeOpen();

			// Set focus back to element before the drawer was opened
			if (focusedBeforeOpen && this.autoFocus() && this.mode() === 'over') {
				focusedBeforeOpen.focus();
				this.focusedBeforeOpen.set(null);
			}
		}
	}

	// Close event handlers
	// ==============================================================================================

	/**
	 * Initializes event handlers for the closeOnClickOutside and keyClose options.
	 */
	private initCloseListeners(): void {
		this.initCloseClickListener();
		this.initCloseKeyDownListener();
	}

	private initCloseClickListener(): void {
		// In a timeout so that things render first
		setTimeout(() => {
			if (this.opened() && this.closeOnClickOutside() && !this.onClickOutsideAttached()) {
				document.addEventListener(this.clickEvent() as keyof DocumentEventMap, this.onClickOutside);
				this.onClickOutsideAttached.set(true);
			}
		});
	}

	private initCloseKeyDownListener(): void {
		// In a timeout so that things render first
		setTimeout(() => {
			if (this.opened() && this.keyClose() && !this.onKeyDownAttached()) {
				document.addEventListener('keydown', this.onKeyDown);
				this.onKeyDownAttached.set(true);
			}
		});
	}

	/**
	 * Destroys all event handlers from _initCloseListeners.
	 */
	private destroyCloseListeners(): void {
		this.destroyCloseClickListener();
		this.destroyCloseKeyDownListener();
	}

	private destroyCloseClickListener(): void {
		if (this.onClickOutsideAttached()) {
			document.removeEventListener(this.clickEvent() as keyof DocumentEventMap, this.onClickOutside);
			this.onClickOutsideAttached.set(false);
		}
	}

	private destroyCloseKeyDownListener(): void {
		if (this.onKeyDownAttached()) {
			document.removeEventListener('keydown', this.onKeyDown);
			this.onKeyDownAttached.set(false);
		}
	}

	/**
	 * Handles `click` events on anything while the drawer is open for the closeOnClickOutside option.
	 * Programatically closes the drawer if a click occurs outside the drawer.
	 *
	 * @param event {MouseEvent} Mouse click event.
	 */
	private onClickOutside(event: Event): void {
		const mouseEvent = event as MouseEvent;
		const element = this.drawer();
		if (this.onClickOutsideAttached() && element && mouseEvent.target instanceof HTMLElement && !element.nativeElement.contains(mouseEvent.target)) {
			this.close();
		}
	}

	/**
	 * Handles the `keydown` event for the keyClose option.
	 *
	 * @param event {KeyboardEvent} Normalized keydown event.
	 */
	private onKeyDown(event: KeyboardEvent | Event): void {
		if ((event as KeyboardEvent).code === this.keyCode()) {
			this.close();
		}
	}

	// Auto collapse handlers
	// ==============================================================================================

	private initCollapseListeners(): void {
		if (this.autoCollapseHeight() || this.autoCollapseWidth()) {
			// In a timeout so that things render first
			setTimeout(() => {
				if (!this.onResizeAttached()) {
					window.addEventListener('resize', this.collapse);
					this.onResizeAttached.set(true);
				}
			});
		}
	}

	private destroyCollapseListeners(): void {
		if (this.onResizeAttached()) {
			window.removeEventListener('resize', this.collapse);
			this.onResizeAttached.set(false);
		}
	}

	private collapse(): void {
		const winHeight: number = window.innerHeight;
		const winWidth: number = window.innerWidth;

		if (this.autoCollapseHeight()) {
			if (winHeight <= this.autoCollapseHeight() && this.opened()) {
				this.wasCollapsed.set(true);
				this.close();
			} else if (winHeight > this.autoCollapseHeight() && this.wasCollapsed()) {
				this.open();
				this.wasCollapsed.set(false);
			}
		}

		if (this.autoCollapseWidth()) {
			if (winWidth <= this.autoCollapseWidth() && this.opened()) {
				this.wasCollapsed.set(true);
				this.close();
			} else if (winWidth > this.autoCollapseWidth() && this.wasCollapsed()) {
				this.open();
				this.wasCollapsed.set(false);
			}
		}
	}

	/**
	 * "Normalizes" position. For example, "start" would be "left" if the page is LTR.
	 */
	private normalizePosition(): void {
		const ltr: boolean = isLTR();

		if (this.position() === 'start') {
			this.position.set(ltr ? 'left' : 'right');
		} else if (this.position() === 'end') {
			this.position.set(ltr ? 'right' : 'left');
		}
	}
}
