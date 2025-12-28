import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TuiButton, TuiError, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { AppService, AuthenticationService } from '../../shared/services';
import { form, required, Field, submit } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { TuiButtonLoading, TuiPassword } from '@taiga-ui/kit';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, merge } from 'rxjs';

@Component({
	selector: 'dp-login',
	imports: [TuiTextfield, TuiButton, TuiButtonLoading, TuiIcon, TuiPassword, TuiError, TranslocoDirective, Field],
	template: `
		<ng-container *transloco="let transloco">
			<tui-textfield class="w-full md:w-1/3">
				@let username = form.username;
				<input tuiTextfield [field]="username" [placeholder]="transloco('profile.username')" (keypress)="onKeyPress($event)" />
				@for (error of username().errors(); track error.kind) {
					@if (username().touched() && username().invalid()) {
						<tui-error [error]="transloco('validation.' + error.kind)" />
					}
				}
			</tui-textfield>
			<tui-textfield class="w-full md:w-1/3">
				@let password = form.password;
				<input tuiTextfield [field]="password" type="password" [placeholder]="transloco('profile.password')" (keypress)="onKeyPress($event)" />
				@for (error of password().errors(); track error.kind) {
					@if (password().touched() && password().invalid()) {
						<tui-error [error]="transloco('validation.' + error.kind)" />
					}
				}
				<tui-icon tuiPassword />
			</tui-textfield>

			<tui-error [error]="wrongCredentials() ? transloco('login.wrongCredentials') : null" />

			<button tuiButton type="button" (click)="login()" [loading]="isLoading()">
				{{ transloco('general.login') }}
			</button>
		</ng-container>
	`,
	styles: `
		@reference '../../../styles.css';

		:host {
			@apply flex flex-col items-center justify-center gap-2 p-2 h-full;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
	private readonly appService = inject(AppService);
	private readonly authService = inject(AuthenticationService);
	private readonly loginModel = signal({
		username: '',
		password: '',
	});

	public readonly isLoading = toSignal(this.appService.isLoading$, { initialValue: false });

	public readonly form = form(this.loginModel, (schema) => {
		required(schema.username);
		required(schema.password);
	});

	public readonly wrongCredentials = toSignal(
		merge(this.authService.wrongCredentials$.pipe(map(() => true)), toObservable(this.form().value).pipe(map(() => false))),
		{ initialValue: false },
	);

	public login(): void {
		submit(this.form, async (value) => {
			const raw = value().value();

			this.authService.login(raw.username, raw.password);
		});
	}

	public onKeyPress(event: KeyboardEvent): void {
		if (event.code === 'Enter' || event.code === 'NumpadEnter') {
			this.login();
		}
	}
}
