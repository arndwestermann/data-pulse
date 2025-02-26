import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiThemeColorService } from '@taiga-ui/cdk';
import { TuiLoader, TuiRoot } from '@taiga-ui/core';
import { AppService, UserService } from './shared/services';
import { take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
	imports: [RouterModule, TuiRoot, TuiLoader],
	selector: 'dp-root',
	template: `
		<tui-root class="h-full bg-red-500" tuiTheme="light">
			<tui-loader [overlay]="true" [showLoader]="isLoading()" class="h-full">
				<router-outlet />
			</tui-loader>
		</tui-root>
	`,
	styles: `
		@reference '../styles.css';

		:host {
			@apply block h-full;
		}
	`,
})
export class AppComponent implements OnInit {
	private readonly theme = inject(TuiThemeColorService);
	private readonly userService = inject(UserService);
	private readonly appService = inject(AppService);

	public readonly isLoading = toSignal(this.appService.isLoading$, { initialValue: false });

	public ngOnInit(): void {
		this.theme.color = '#393D47';
		this.userService.user$.pipe(take(1)).subscribe();
	}
}
