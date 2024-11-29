import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	standalone: true,
	imports: [RouterModule],
	selector: 'dp-root',
	template: ` <router-outlet /> `,
	styleUrl: './app.component.scss',
})
export class AppComponent {}
