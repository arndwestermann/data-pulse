import { Route } from '@angular/router';
import { HeatMapComponent, NavigationComponent, RecordsComponent } from './components';
import { isAuthenticatedGuard } from './shared/guards';

export const appRoutes: Route[] = [
	{
		path: '',
		component: NavigationComponent,
		canActivate: [isAuthenticatedGuard],
		children: [
			{
				path: 'records',
				component: RecordsComponent,
				data: {
					translationKey: 'records',
					icon: 'table-list',
				},
			},
			{
				path: 'heatmap',
				component: HeatMapComponent,
				data: {
					translationKey: 'heatmap',
					icon: 'fire',
				},
			},
			{
				path: '',
				redirectTo: 'records',
				pathMatch: 'full',
			},
		],
	},
	{
		path: 'login',
		canActivate: [isAuthenticatedGuard],
		loadComponent: () => import('./components/login/login.component').then((c) => c.LoginComponent),
	},
];
