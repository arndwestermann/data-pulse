import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication/authentication.service';
import { HttpClient } from '@angular/common/http';
import { catchError, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser } from '../../models';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private readonly http = inject(HttpClient);
	private readonly authService = inject(AuthenticationService);

	public readonly user$ = this.authService.tokens$.pipe(
		switchMap((token) => (token ? this.http.get<IUser>(`${environment.baseUrl}/user/me`) : of(null))),
		catchError(() => of(null)),
		shareReplay(1),
	);
}
