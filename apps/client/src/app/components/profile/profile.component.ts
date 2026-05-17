import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { applyWhen, email, form, minLength, pattern, required, validate, Field, submit } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiButton, TuiError, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiPassword } from '@taiga-ui/kit';
import { TranslocoDirective } from '@jsverse/transloco';
import { passwordMatchesValidator } from './validators';
import { STRENGTH_REGEX, TUserForm } from '../../shared/models';
import { UserService } from '../../shared/services';

@Component({
	selector: 'dp-profile',
	imports: [TuiTextfield, TuiButton, TuiIcon, TuiPassword, TuiError, TranslocoDirective, Field],
	template: `
		<form class="flex flex-col w-full md:w-1/2 gap-2" *transloco="let transloco">
			<div class="flex flex-col">
				@let username = form.username;
				<tui-textfield>
					<input tuiTextfield [field]="username" [placeholder]="transloco('profile.username')" (keypress)="onKeyPress($event)" />
					@for (error of username().errors(); track error.kind) {
						<tui-error [error]="transloco('validation.' + error.kind)" />
					}
				</tui-textfield>
			</div>
			<div class="flex flex-col">
				@let email = form.email;
				<tui-textfield>
					<input tuiTextfield [field]="email" [placeholder]="transloco('profile.email')" (keypress)="onKeyPress($event)" />
					@for (error of email().errors(); track error.kind) {
						<tui-error [error]="transloco('validation.' + error.kind)" />
					}
				</tui-textfield>
			</div>
			<div class="flex flex-col md:flex-row gap-2">
				<div class="w-full md:w-1/2 flex flex-col">
					<tui-textfield>
						@let password = form.password;
						<input tuiTextfield [field]="password" type="password" [placeholder]="transloco('profile.password')" (keypress)="onKeyPress($event)" />
						@for (error of password().errors(); track error.kind) {
							@if (error.kind === 'required') {
								<tui-error [error]="transloco('validation.' + error.kind)" />
							}
						}
						<tui-icon tuiPassword />
					</tui-textfield>
					@for (error of password().errors(); track error.kind) {
						@if (error.kind !== 'required') {
							<tui-error [error]="transloco('validation.' + error.kind)" />
						}
					}
				</div>
				<div class="w-full md:w-1/2 flex flex-col gap-2">
					<tui-textfield>
						@let confirmPassword = form.confirmPassword;
						<input
							tuiTextfield
							[field]="confirmPassword"
							type="password"
							[placeholder]="transloco('profile.confirmPassword')"
							(keypress)="onKeyPress($event)" />
						@for (error of confirmPassword().errors(); track error.kind) {
							@if (confirmPassword().invalid() && error.kind === 'required') {
								<tui-error [error]="transloco('validation.' + error.kind)" />
							}
						}
						<tui-icon tuiPassword />
					</tui-textfield>
					@for (error of confirmPassword().errors(); track error.kind) {
						@if (error.kind !== 'required') {
							<tui-error [error]="transloco('validation.' + error.kind)" />
						}
					}
				</div>
			</div>
			<button type="button" tuiButton (click)="save()">{{ transloco('general.save') }}</button>
		</form>
	`,
	styles: `
		@reference '../../../styles.css';

		:host {
			@apply h-full w-full p-2 flex justify-center items-center;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
	private readonly userService = inject(UserService);
	private readonly user = toSignal(this.userService.user$, { initialValue: null });

	private readonly userModel = linkedSignal(() => {
		const user = this.user();

		return {
			uuid: user?.uuid,
			username: user?.username ?? '',
			email: user?.email ?? '',
			password: '',
			confirmPassword: '',
		} satisfies TUserForm as TUserForm;
	});
	public readonly form = form(this.userModel, (schema) => {
		required(schema.username);

		required(schema.email);
		email(schema.email);
		applyWhen(
			schema.password,
			({ valueOf }) => valueOf(schema.password) !== '' || valueOf(schema.confirmPassword) !== '',
			(path) => {
				required(path);
				minLength(path, 8);
				pattern(path, STRENGTH_REGEX);
			},
		);

		applyWhen(
			schema.confirmPassword,
			({ valueOf }) => valueOf(schema.password) !== '' || valueOf(schema.confirmPassword) !== '',
			(path) => {
				required(path);
				validate(path, (context) => passwordMatchesValidator(context, schema.password));
			},
		);
	});

	public save(): void {
		submit(this.form, async (value) => {
			const raw = value().value();

			this.userService.updateUser({
				uuid: raw.uuid,
				username: raw.username,
				email: raw.email,
				password: raw.password || undefined,
			});
		});
	}

	public onKeyPress(event: KeyboardEvent): void {
		if (event.code === 'Enter' || event.code === 'NumpadEnter') {
			this.save();
		}
	}
}
