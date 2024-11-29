import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

@Component({
	standalone: true,
	imports: [RouterModule, TuiRoot],
	selector: 'dp-root',
	template: `
		<tui-root class="h-full" tuiTheme="light">
			<router-outlet />
		</tui-root>
	`,
	styles: `
		:host {
			@apply block h-full;
		}
	`,
})
export class AppComponent {}
