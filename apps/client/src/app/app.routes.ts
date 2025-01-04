import { Route } from '@angular/router';
import { NavigationComponent } from './components';
import { isAuthenticatedGuard } from './shared/guards';

export const appRoutes: Route[] = [
	{
		path: '',
		component: NavigationComponent,
		canActivate: [isAuthenticatedGuard],
		children: [
			{
				path: 'records',
				loadComponent: () => import('./components/records/records.component').then((c) => c.RecordsComponent),
				data: {
					translationKey: 'records',
					icon: 'table-list',
					exclude: false,
				},
			},
			{
				path: 'heatmap',
				loadComponent: () => import('./components/heat-map/heat-map.component').then((c) => c.HeatMapComponent),
				data: {
					translationKey: 'heatmap',
					icon: 'fire',
					exclude: false,
				},
			},
			{
				path: 'profile',
				loadComponent: () => import('./components/profile/profile.component').then((c) => c.ProfileComponent),
				data: {
					exclude: true,
				},
			},
			{
				path: '',
				redirectTo: 'records',
				pathMatch: 'full',
				data: {
					exclude: true,
				},
			},
		],
	},
	{
		path: 'login',
		canActivate: [isAuthenticatedGuard],
		loadComponent: () => import('./components/login/login.component').then((c) => c.LoginComponent),
	},
];
