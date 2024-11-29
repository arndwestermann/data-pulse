import { Route } from '@angular/router';
import { NavigationComponent, RecordsComponent } from './components';

export const appRoutes: Route[] = [
	{
		path: '',
		component: NavigationComponent,
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
				path: '',
				redirectTo: 'records',
				pathMatch: 'full',
			},
		],
	},
];
