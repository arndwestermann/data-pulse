import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiThemeColorService } from '@taiga-ui/cdk';
import { TuiRoot } from '@taiga-ui/core';
import { UserService } from './shared/services';
import { take } from 'rxjs';

@Component({
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
export class AppComponent implements OnInit {
	private readonly theme = inject(TuiThemeColorService);
	private readonly userService = inject(UserService);

	public ngOnInit(): void {
		this.theme.color = '#393D47';
		this.userService.user$.pipe(take(1)).subscribe();
	}
}
