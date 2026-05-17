import { ApplicationConfig, isDevMode, importProvidersFrom, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { TuiDialog } from '@taiga-ui/core';
import { TUI_LANGUAGE, TUI_GERMAN_LANGUAGE, TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n';

import localeEnGB from '@angular/common/locales/en-GB';
import localeDeDE from '@angular/common/locales/de';
import { STORAGE_TOKEN } from './shared/services';
import { accessTokenInterceptor, LOADING_INTERCEPTOR_PROVIDER } from './shared/interceptors';
import { distinctUntilChanged, map } from 'rxjs';
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';

registerLocaleData(localeEnGB, 'en-GB');
registerLocaleData(localeDeDE, 'de-DE');

export function initializeApplication(translocoService: TranslocoService): () => void {
	return () => translocoService.setActiveLang(navigator.language.split('-')[0]);
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideAnimations(),
		provideZonelessChangeDetection(),
		provideSignalFormsConfig({
			classes: NG_STATUS_CLASSES,
		}),
		provideRouter(appRoutes, withComponentInputBinding()),
		provideHttpClient(withInterceptorsFromDi(), withInterceptors([accessTokenInterceptor])),
		provideTransloco({
			config: {
				availableLangs: ['en', 'de'],
				defaultLang: 'en',
				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
			},
			loader: TranslocoHttpLoader,
		}),
		importProvidersFrom(TuiDialog),
		provideEventPlugins(),
		{ provide: STORAGE_TOKEN, useValue: localStorage },
		provideAppInitializer(() => {
			const initializerFn = initializeApplication(inject(TranslocoService));
			return initializerFn();
		}),
		{
			provide: TUI_LANGUAGE,
			useFactory: (translocoService: TranslocoService) =>
				translocoService.langChanges$.pipe(
					distinctUntilChanged(),
					map((lang) => {
						switch (lang) {
							case 'de':
								return TUI_GERMAN_LANGUAGE;
							default:
								return TUI_ENGLISH_LANGUAGE;
						}
					}),
				),
			deps: [TranslocoService],
		},
		LOADING_INTERCEPTOR_PROVIDER,
	],
};
