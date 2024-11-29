import { Route } from '@angular/router';
import { HeatMapComponent, NavigationComponent, RecordsComponent } from './components';

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
];
