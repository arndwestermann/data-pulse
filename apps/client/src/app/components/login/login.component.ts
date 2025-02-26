import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton, TuiError, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { AppService, AuthenticationService } from '../../shared/services';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { TuiButtonLoading, TuiPassword } from '@taiga-ui/kit';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, merge } from 'rxjs';

@Component({
	selector: 'dp-login',
	imports: [ReactiveFormsModule, TuiTextfield, TuiButton, TuiButtonLoading, TuiIcon, TuiPassword, TuiError, TranslocoDirective],
	template: `
		<ng-container *transloco="let transloco" [formGroup]="credentials">
			<tui-textfield class="w-full md:w-1/3">
				<input
					tuiTextfield
					formControlName="username"
					[invalid]="(credentials.controls.username.touched && this.credentials.controls.username.getError('required')) || wrongCredentials()"
					[placeholder]="transloco('profile.username')"
					(keypress)="onKeyPress($event)" />
			</tui-textfield>
			<tui-error
				[error]="
					credentials.controls.username.touched && this.credentials.controls.username.getError('required')
						? transloco('validation.required', { field: transloco('profile.username') })
						: null
				" />
			<tui-textfield class="w-full md:w-1/3">
				<input
					tuiTextfield
					formControlName="password"
					type="password"
					[invalid]="(credentials.controls.password.touched && this.credentials.controls.password.getError('required')) || wrongCredentials()"
					[placeholder]="transloco('profile.password')"
					(keypress)="onKeyPress($event)" />
				<tui-icon tuiPassword />
			</tui-textfield>
			<tui-error
				[error]="
					credentials.controls.password.touched && this.credentials.controls.password.getError('required')
						? transloco('validation.required', { field: transloco('profile.password') })
						: null
				" />

			<tui-error [error]="wrongCredentials() ? transloco('login.wrongCredentials') : null" />

			<span>{{ credentials.getError('wrongCredentials') }}</span>

			<button tuiButton type="button" (click)="login()" [loading]="isLoading()">
				{{ transloco('general.login') }}
			</button>
		</ng-container>
	`,
	styles: `
		:host {
			@apply flex flex-col items-center justify-center gap-2 p-2 h-full;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
	private readonly appService = inject(AppService);
	private readonly authService = inject(AuthenticationService);

	public readonly isLoading = toSignal(this.appService.isLoading$, { initialValue: false });

	public readonly credentials = new FormGroup({
		username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
		password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
	});

	public readonly wrongCredentials$ = merge(
		this.authService.wrongCredentials$.pipe(map(() => true)),
		this.credentials.valueChanges.pipe(map(() => false)),
	);

	public readonly wrongCredentials = toSignal(this.wrongCredentials$, { initialValue: false });

	public login(): void {
		if (this.credentials.invalid) {
			this.credentials.markAllAsTouched();
			this.credentials.updateValueAndValidity();
		} else {
			this.authService.login(this.credentials.controls.username.value, this.credentials.controls.password.value);
		}
	}

	public onKeyPress(event: KeyboardEvent): void {
		if (event.code === 'Enter' || event.code === 'NumpadEnter') {
			this.login();
		}
	}
}
