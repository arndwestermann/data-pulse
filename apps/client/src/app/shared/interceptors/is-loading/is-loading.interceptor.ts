import { inject, Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { concatMap, filter, finalize, Observable, take } from 'rxjs';
import { AppService } from '../../services';

// TODO: Refactor to functional approach
@Injectable()
export class IsLoadingInterceptor implements HttpInterceptor {
	private readonly appService = inject(AppService);

	private readonly exludedUrls = ['i18n', 'refresh'];

	private requests = 0;

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		if (this.isExcludedUrl(request.url, this.exludedUrls)) return next.handle(request);

		this.requests++;

		return this.appService.isLoading$.pipe(
			take(1),
			concatMap((isLoading) => {
				if (!isLoading && !this.isExcludedUrl(request.url, this.exludedUrls)) {
					this.appService.setLoading(true);
				}

				return next.handle(request);
			}),
			filter((event) => event instanceof HttpResponse),
			finalize(() => {
				this.requests--;

				if (this.requests < 0) this.requests = 0;

				if (this.requests <= 0) {
					this.appService.setLoading(false);
				}
			}),
		);
	}

	isExcludedUrl(url: string, exludedUrls: string[]): boolean {
		return exludedUrls.some((exludedUrl) => url.includes(exludedUrl));
	}
}

export const LOADING_INTERCEPTOR_PROVIDER = {
	provide: HTTP_INTERCEPTORS,
	useClass: IsLoadingInterceptor,
	multi: true,
};
