import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { passwordMatchesValidator } from './validators';
import { STRENGTH_REGEX } from '../../shared/models';
import { UserService } from '../../shared/services';
import { TuiButton, TuiError, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiPassword } from '@taiga-ui/kit';

@Component({
	selector: 'dp-profile',
	imports: [ReactiveFormsModule, TuiTextfield, TuiButton, TuiIcon, TuiPassword, TuiError, TranslocoDirective],
	template: `
		<form [formGroup]="profile()" class="flex flex-col w-1/2 gap-2" *transloco="let transloco">
			<div class="flex flex-col">
				<tui-textfield>
					<input tuiTextfield formControlName="username" [placeholder]="transloco('profile.username')" (keypress)="onKeyPress($event)" />
				</tui-textfield>
				@let usernameRequiredError = profile().controls.username.hasError('required');

				<tui-error [error]="usernameRequiredError ? transloco('validation.required', { field: transloco('profile.username') }) : null" />
			</div>
			<div class="flex flex-col">
				<tui-textfield>
					<input tuiTextfield formControlName="email" [placeholder]="transloco('profile.email')" (keypress)="onKeyPress($event)" />
				</tui-textfield>

				@let emailRequiredError = profile().controls.email.hasError('required');
				<tui-error [error]="emailRequiredError ? transloco('validation.required', { field: transloco('profile.email') }) : null" />
			</div>
			<div class="flex space-x-2">
				<div class="w-1/2 flex flex-col">
					<tui-textfield>
						<input
							tuiTextfield
							formControlName="password"
							type="password"
							[placeholder]="transloco('profile.password')"
							(keypress)="onKeyPress($event)" />
						<tui-icon tuiPassword />
					</tui-textfield>
					@let minLengthError = profile().controls.password.hasError('minlength');
					@let patternError = profile().controls.password.hasError('pattern');

					<tui-error [error]="minLengthError ? transloco('validation.minLength') : null" />
					<tui-error [error]="patternError ? transloco('validation.pattern') : null" />
				</div>
				<div class="w-1/2 flex flex-col space-y-2">
					<tui-textfield>
						<input
							tuiTextfield
							formControlName="confirmPassword"
							type="password"
							[placeholder]="transloco('profile.confirmPassword')"
							(keypress)="onKeyPress($event)" />
						<tui-icon tuiPassword />
					</tui-textfield>
					@let mustMatchError = profile().hasError('mustMatch');
					<tui-error [error]="mustMatchError ? transloco('validation.mustMatch') : null" />
				</div>
			</div>
			<button type="button" tuiButton (click)="save()">{{ transloco('general.save') }}</button>
		</form>
	`,
	styles: `
		:host {
			@apply h-full w-full flex justify-center items-center;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
	private readonly userService = inject(UserService);

	private readonly user = toSignal(this.userService.user$, { initialValue: null });

	public readonly profile = computed(() => {
		const user = this.user();

		return new FormGroup(
			{
				uuid: new FormControl<string | null>(user?.uuid ?? null),
				username: new FormControl<string>(user?.username ?? '', { nonNullable: true, validators: [Validators.required] }),
				email: new FormControl<string>(user?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
				password: new FormControl<string | null>(null, {
					validators: [Validators.minLength(8), Validators.pattern(STRENGTH_REGEX)],
				}),
				confirmPassword: new FormControl<string | null>(null),
			},
			{ validators: [passwordMatchesValidator] },
		);
	});

	public save(): void {
		const value = this.profile().getRawValue();

		if (this.profile().invalid) return;

		this.userService.updateUser({
			uuid: value.uuid ?? undefined,
			username: value.username,
			email: value.email,
			password: value.password ?? undefined,
		});
	}

	public onKeyPress(event: KeyboardEvent): void {
		if (event.code === 'Enter' || event.code === 'NumpadEnter') {
			this.save();
		}
	}
}
