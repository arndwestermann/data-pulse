import { HttpInterceptorFn } from '@angular/common/http';
import { AuthenticationService } from '../../services';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { IS_PUBLIC_REQUEST } from '../../models';

export const accessTokenInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthenticationService);

	if (req.headers.has(IS_PUBLIC_REQUEST) || req.url.includes('i18n')) {
		return next(req.clone({ headers: req.headers.delete(IS_PUBLIC_REQUEST) }));
	}

	return authService.tokens$.pipe(
		take(1),
		switchMap((tokens) => (tokens ? next(req.clone({ setHeaders: { Authorization: `Bearer ${tokens?.accessToken}` } })) : next(req))),
	);
};
