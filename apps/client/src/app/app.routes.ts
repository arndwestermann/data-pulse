import { Route } from '@angular/router';
import { NavigationComponent } from './components';

export const appRoutes: Route[] = [
	{
		path: '',
		component: NavigationComponent,
		children: [
			{
				path: '',
				redirectTo: 'records',
				pathMatch: 'full',
			},
		],
	},
];
