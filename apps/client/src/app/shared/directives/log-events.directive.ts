import { Directive, ElementRef, AfterViewInit, output, inject } from '@angular/core';

@Directive({
	selector: '[logAllEvents]',
})
export class LogAllEventsDirective implements AfterViewInit {
	private readonly elementRef = inject(ElementRef);
	public readonly logAllEvents = output<{ name: string; event: unknown }>();

	ngAfterViewInit() {
		const events = [
			'blur',
			'focus',
			'input',
			'change',
			'keydown',
			'keyup',
			'click',
			'dblclick',
			'mousedown',
			'mouseup',
			'mouseenter',
			'mouseleave',
			'contextmenu',
			'paste',
			'cut',
			'copy',
			'wheel',
			'select',
		];

		events.forEach((name) => {
			this.elementRef.nativeElement.addEventListener(name, (event: unknown) => {
				this.logAllEvents.emit({ name, event });
			});
		});
	}
}
