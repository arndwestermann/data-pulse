import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DrawerComponent, DrawerContainerComponent } from '../drawer';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiAutoColorPipe, TuiButton, TuiDataList, TuiDropdown, TuiIcon, TuiInitialsPipe } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { TuiAvatar } from '@taiga-ui/kit';
import { AuthenticationService, UserService } from '../../shared/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const angularImports = [RouterOutlet, RouterLink, RouterLinkActive, NgClass];
const taigaUiImports = [TuiButton, TuiIcon, TuiAvatar, TuiDropdown, TuiInitialsPipe, TuiAutoColorPipe, TuiDataList];
const thirdPartyImports = [TranslocoDirective];

@Component({
	selector: 'dp-navigation',
	imports: [DrawerContainerComponent, DrawerComponent, ...angularImports, ...taigaUiImports, ...thirdPartyImports],
	templateUrl: './navigation.component.html',
	styles: `
		:host {
			@apply flex flex-col h-full;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('nav-animation-icon', [
			state(
				'opened',
				style({
					transform: 'translateX(0)',
				}),
			),
			state(
				'closed',
				style({
					transform: 'translateX(12rem)',
				}),
			),
			transition('* <=> *', animate('300ms cubic-bezier(0, 0, 0.3, 1)')),
		]),
		trigger('nav-animation-text', [
			state(
				'opened',
				style({
					opacity: 1,
				}),
			),
			state(
				'closed',
				style({
					opacity: 0,
				}),
			),
			transition('* <=> *', animate('10ms cubic-bezier(0, 0, 0.3, 1)')),
		]),
	],
})
export class NavigationComponent {
	private readonly router = inject(Router);
	private readonly authService = inject(AuthenticationService);
	private readonly userService = inject(UserService);
	private readonly breakpointObserver = inject(BreakpointObserver);

	public readonly isXSmall = toSignal(
		this.breakpointObserver.observe([Breakpoints.XSmall]).pipe(map((breakPoints) => breakPoints.breakpoints[Breakpoints.XSmall])),
		{
			initialValue: false,
		},
	);

	public readonly isDrawerOpen = signal<boolean>(false);
	public readonly routes = signal(this.router.config[0].children?.filter((route) => route.data?.['exclude'] === false) ?? []);
	public readonly isProfileDropdownOpen = signal<boolean>(false);
	public readonly username = toSignal(this.userService.user$.pipe(map((user) => user?.username ?? 'Unknown')), { initialValue: 'Unknown' });

	public logout(): void {
		this.authService.logout();
	}
}
