import { Directive, HostListener, inject } from '@angular/core';

import { DrawerComponent } from './drawer.component';

@Directive({
	selector: '[dpCloseDrawer]',
	standalone: true,
})
export class CloseDrawerDirective {
	private readonly drawer = inject(DrawerComponent);

	/** @internal */
	@HostListener('click', ['$event'])
	public onHostClick() {
		if (this.drawer) {
			this.drawer.close();
		}
	}
}
