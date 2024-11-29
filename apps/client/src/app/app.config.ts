import { ApplicationConfig, provideZoneChangeDetection, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';

export function initializeApplication(translocoService: TranslocoService): () => void {
	return () => translocoService.setActiveLang(navigator.language.split('-')[0]);
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(appRoutes),
		provideHttpClient(),
		provideTransloco({
			config: {
				availableLangs: ['en', 'de'],
				defaultLang: 'en',
				// Remove this option if your application doesn't support changing language in runtime.
				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
			},
			loader: TranslocoHttpLoader,
		}),
		{
			provide: APP_INITIALIZER,
			useFactory: initializeApplication,
			deps: [TranslocoService],
			multi: true,
		},
	],
};
