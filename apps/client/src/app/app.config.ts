import { ApplicationConfig, isDevMode, APP_INITIALIZER, importProvidersFrom, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { NG_EVENT_PLUGINS } from '@taiga-ui/event-plugins';
import { TuiDialog } from '@taiga-ui/core';

import localeEnGB from '@angular/common/locales/en-GB';
import localeDeDE from '@angular/common/locales/de';
import { STORAGE_TOKEN } from './shared/services';

registerLocaleData(localeEnGB, 'en-GB');
registerLocaleData(localeDeDE, 'de-DE');

export function initializeApplication(translocoService: TranslocoService): () => void {
	return () => translocoService.setActiveLang(navigator.language.split('-')[0]);
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideAnimations(),
		provideExperimentalZonelessChangeDetection(),
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
		importProvidersFrom(TuiDialog),
		NG_EVENT_PLUGINS,
		{ provide: STORAGE_TOKEN, useValue: localStorage },
		{
			provide: APP_INITIALIZER,
			useFactory: initializeApplication,
			deps: [TranslocoService],
			multi: true,
		},
	],
};
