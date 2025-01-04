import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication/authentication.service';
import { HttpClient } from '@angular/common/http';
import { catchError, merge, of, shareReplay, Subject, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser, UpdateUser } from '../../models';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private readonly http = inject(HttpClient);
	private readonly authService = inject(AuthenticationService);

	private readonly updateUserSubject = new Subject<UpdateUser>();

	private readonly readUser$ = this.authService.tokens$.pipe(
		switchMap((token) => (token ? this.http.get<IUser>(`${environment.baseUrl}/user/me`) : of(null))),
		catchError(() => of(null)),
	);

	public readonly updateUser$ = this.updateUserSubject.pipe(
		switchMap((user) => {
			const uuid = user.uuid;
			delete user.uuid;

			return this.http.patch<IUser>(`${environment.baseUrl}/user/${uuid}`, user);
		}),
	);

	// TODO: Add cache
	public readonly user$ = merge(this.readUser$, this.updateUser$).pipe(shareReplay(1));

	public updateUser(user: UpdateUser): void {
		this.updateUserSubject.next(user);
	}
}
