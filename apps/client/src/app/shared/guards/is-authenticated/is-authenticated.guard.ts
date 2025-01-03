import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../../services';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';

export const isAuthenticatedGuard: CanActivateFn = (_route, _state) => {
	const authService = inject(AuthenticationService);
	const router = inject(Router);
	return authService.tokens$.pipe(
		take(1),
		map((token) => {
			const redirectUrl = _state.url;
			if (token) {
				return _state.url.includes('login') ? router.parseUrl('') : true;
			}

			return _state.url.includes('login') ? true : router.parseUrl(`/login?redirect=${redirectUrl}`);
		}),
	);
};
