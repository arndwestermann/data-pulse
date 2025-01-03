import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
	catchError,
	EMPTY,
	expand,
	filter,
	map,
	merge,
	Observable,
	of,
	repeat,
	share,
	shareReplay,
	skip,
	Subject,
	switchMap,
	tap,
	timer,
	withLatestFrom,
} from 'rxjs';
import { AUTH_STORAGE_KEY, IS_PUBLIC_REQUEST, IToken, ITokenResponse } from '../../models';
import { CacheService } from '../cache/cache.service';
import { addSeconds, isPast } from 'date-fns';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class AuthenticationService {
	private readonly http = inject(HttpClient);
	private readonly cacheService = inject(CacheService);
	private readonly router = inject(Router);
	private readonly activatedRoute = inject(ActivatedRoute);

	private readonly loginSubject = new Subject<{ username: string; password: string }>();
	private readonly logoutSubject = new Subject<void>();

	private readonly loginRequest$ = this.loginSubject.pipe(
		switchMap(({ username, password }) =>
			this.http.post<ITokenResponse>(
				`${environment.baseUrl}/auth/login`,
				{ username, password },
				{
					headers: new HttpHeaders({
						[IS_PUBLIC_REQUEST]: '',
					}),
				},
			),
		),
		catchError((error: HttpErrorResponse) => of(error)),
		repeat(),
		share(),
	);

	private readonly loginSuccess$ = this.loginRequest$.pipe(
		filter((res): res is ITokenResponse => 'accessToken' in res),
		map(
			(tokens) =>
				({
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					accessTokenExpiresAt: addSeconds(new Date(), tokens.accessTokenExpiresIn * 0.9),
					refreshTokenExpiresAt: addSeconds(new Date(), tokens.refreshTokenExpiresIn),
				}) satisfies IToken as IToken,
		),
		withLatestFrom(this.activatedRoute.queryParamMap),
		map(([token, params]) => {
			const redirectUrl = params.get('redirect') ?? '';

			this.router.navigate([redirectUrl]);
			return token;
		}),
	);

	private readonly logoutRequest$ = this.logoutSubject.pipe(
		switchMap(() => this.http.delete<unknown>(`${environment.baseUrl}/auth/logout`)),
		map(() => null),
		tap(() => this.router.navigate(['/login'])),
	);

	private readonly cachedTokens$ = this.cacheService.load<IToken>(AUTH_STORAGE_KEY);

	public readonly tokens$ = merge(this.loginSuccess$, this.cachedTokens$, this.logoutRequest$).pipe(
		switchMap((token) => {
			if (!token) return of(null);

			if (isPast(token.refreshTokenExpiresAt)) return of(null);

			return merge(of(token), this.silentRefreshAccessToken(token));
		}),
		switchMap((tokens) => this.cacheService.save(AUTH_STORAGE_KEY, tokens)),
		shareReplay(1),
	);

	public readonly wrongCredentials$ = this.loginRequest$.pipe(
		filter((res): res is HttpErrorResponse => 'status' in res && res.status === HttpStatusCode.BadRequest),
	);

	public login(username: string, password: string) {
		this.loginSubject.next({ username, password });
	}

	public logout() {
		this.logoutSubject.next();
	}

	private silentRefreshAccessToken(tokens: IToken): Observable<IToken> {
		return of(tokens).pipe(
			expand(({ refreshToken, accessTokenExpiresAt: expiresAt }) => {
				return timer(expiresAt).pipe(
					switchMap(() => this.http.post<ITokenResponse>(`${environment.baseUrl}/auth/refresh`, { grandType: 'refreshToken', token: refreshToken })),
					map(
						(tokens) =>
							({
								accessToken: tokens.accessToken,
								refreshToken: tokens.refreshToken,
								accessTokenExpiresAt: addSeconds(new Date(), tokens.accessTokenExpiresIn * 0.9),
								refreshTokenExpiresAt: addSeconds(new Date(), tokens.refreshTokenExpiresIn),
							}) satisfies IToken,
					),
					catchError((error) => {
						console.error('Silent refresh failed:', error);
						return EMPTY;
					}),
				);
			}),
			skip(1),
		);
	}
}
