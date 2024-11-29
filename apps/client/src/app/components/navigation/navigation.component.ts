import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DrawerComponent, DrawerContainerComponent } from '../drawer';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

const angularImports = [RouterOutlet, RouterLink, RouterLinkActive, NgClass];
const taigaUiImports = [TuiButton, TuiIcon];
const thirdPartyImports = [TranslocoDirective];

@Component({
	selector: 'dp-navigation',
	standalone: true,
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

	public readonly isDrawerOpen = signal<boolean>(false);
	public readonly routes = signal(this.router.config[0].children?.filter((route) => route.path !== ''));
}
