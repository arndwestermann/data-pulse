import {
	ApplicationConfig,
	isDevMode,
	importProvidersFrom,
	provideExperimentalZonelessChangeDetection,
	inject,
	provideAppInitializer,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { NG_EVENT_PLUGINS } from '@taiga-ui/event-plugins';
import { TuiDialog } from '@taiga-ui/core';
import { TUI_LANGUAGE, TUI_GERMAN_LANGUAGE, TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n';

import localeEnGB from '@angular/common/locales/en-GB';
import localeDeDE from '@angular/common/locales/de';
import { STORAGE_TOKEN } from './shared/services';
import { accessTokenInterceptor } from './shared/interceptors';
import { distinctUntilChanged, map } from 'rxjs';

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
		provideHttpClient(withInterceptors([accessTokenInterceptor])),
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
		NG_EVENT_PLUGINS,
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
	],
};
