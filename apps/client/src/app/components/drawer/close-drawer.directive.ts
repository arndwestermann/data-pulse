import { Directive, inject } from '@angular/core';

import { DrawerComponent } from './drawer.component';

@Directive({
	selector: '[dpCloseDrawer]',
	host: {
		click: 'onHostClick()',
	},
})
export class CloseDrawerDirective {
	private readonly drawer = inject(DrawerComponent);

	/** @internal */
	public onHostClick() {
		if (this.drawer) {
			this.drawer.close();
		}
	}
}
