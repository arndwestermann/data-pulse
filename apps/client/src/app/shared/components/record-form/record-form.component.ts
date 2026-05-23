import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiDialogContext, TuiError, TuiTextfield } from '@taiga-ui/core';

import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TuiAutoFocus, TuiDay, TuiTime } from '@taiga-ui/cdk';
import { TuiChevron, TuiComboBox, TuiDataListWrapper, TuiFilterByInputPipe, TuiInputDateTime, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { RecordService } from '../../services';
import { IRecord, SPECIALTIES, Specialty, TRecordForm } from '../../models';
import { debounce, FormField, form, required, submit, validateAsync } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { toNativeDateTime, toTuiDayTime } from '../../utils';

const angularImports = [ReactiveFormsModule, NgTemplateOutlet, FormField];
const thirdPartyImports = [TranslocoDirective];
const taigaUiImports = [
	TuiButton,
	TuiDataListWrapper,
	TuiTextfield,
	TuiInputDateTime,
	TuiFilterByInputPipe,
	TuiStringifyContentPipe,
	TuiComboBox,
	TuiAutoFocus,
	TuiError,
	TuiChevron,
];

@Component({
	selector: 'dp-record-form',
	imports: [...angularImports, ...thirdPartyImports, ...taigaUiImports],
	template: `
		<form class="flex flex-col gap-2" *transloco="let transloco">
			<div class="w-full">
				<ng-container *ngTemplateOutlet="inputTemplate; context: { label: 'id', control: form.id, type: 'text', autoFocus: true }" />
			</div>
			<div class="flex gap-2">
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { label: 'arrival', control: form.arrival, type: 'datetime' }" />
				</div>
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { label: 'leaving', control: form.leaving, type: 'datetime' }" />
				</div>
			</div>
			<div class="flex gap-2">
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { label: 'from', control: form.from, type: 'text' }" />
				</div>
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { label: 'to', control: form.to, type: 'text' }" />
				</div>
			</div>

			<ng-container *ngTemplateOutlet="dropdownTemplate; context: { label: 'specialty', control: specialtyControl, array: specialties() }" />

			<button tuiButton class="w-full" type="button" size="m" [disabled]="form().invalid() || specialtyControl.invalid" (click)="save()">
				<span class="mr-2 font-normal">{{ transloco('general.save') }}</span>
			</button>

			<ng-template let-label="label" let-control="control" let-type="type" let-autoFocus="autoFocus" #inputTemplate>
				@switch (type) {
					@case ('datetime') {
						<tui-textfield [tuiTextfieldCleaner]="true">
							<label tuiLabel> {{ transloco('records.' + label) }}</label>
							<input
								tuiInputDateTime
								[formField]="control"
								[tuiAutoFocus]="autoFocus ?? false"
								[min]="label === 'arrival' ? null : minDate()"
								(focus)="onFocused($event)" />
							@for (error of control().errors(); track error.kind) {
								<tui-error [error]="transloco('validation.' + error.kind)" />
							}
							<tui-calendar *tuiTextfieldDropdown />
						</tui-textfield>
					}
					@default {
						<tui-textfield>
							<label tuiLabel> {{ transloco('records.' + label) }}</label>
							<input tuiTextfield [tuiAutoFocus]="autoFocus ?? false" [formField]="control" type="text" (keypress)="keyPress($event)" />
							@for (error of control().errors(); track error.kind) {
								<tui-error [error]="transloco('validation.' + error.kind)" />
							}
						</tui-textfield>
					}
				}
			</ng-template>

			<ng-template let-label="label" let-control="control" let-array="array" #dropdownTemplate>
				<tui-textfield tuiChevron [stringify]="stringifySpecialty">
					<label tuiLabel> {{ transloco('records.' + label) }}</label>
					<input tuiComboBox [formControl]="control" (keypress)="keyPress($event)" />

					@if (control.hasError('required')) {
						<tui-error [error]="transloco('validation.required')" />
					}

					<tui-data-list-wrapper
						*tuiTextfieldDropdown
						new
						[items]="array | tuiFilterByInput"
						[itemContent]="stringifySpecialty | tuiStringifyContent" />
				</tui-textfield>
			</ng-template>
		</form>
	`,
	styles: `
		@reference '../../../../styles.css';

		:host {
			@apply block;

			.ng-invalid,
			.ng-invalid:focus {
				outline-color: var(--tui-status-negative);
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordFormComponent {
	private readonly translocoService = inject(TranslocoService);
	private readonly recordsService = inject(RecordService);

	public readonly context = inject<TuiDialogContext<IRecord, IRecord | null>>(POLYMORPHEUS_CONTEXT);
	public readonly specialties = signal(SPECIALTIES);

	public readonly recordModel = signal<TRecordForm>({
		uuid: this.context.data?.uuid ?? null,
		id: this.context.data?.id ?? '',
		arrival: toTuiDayTime(this.context.data?.arrival ?? new Date()),
		leaving: this.context.data?.leaving ? toTuiDayTime(this.context.data.leaving) : null,
		from: this.context.data?.from ?? '',
		to: this.context.data?.to ?? '',
		specialty: this.context.data?.specialty ?? 'internal',
	});

	public readonly form = form(this.recordModel, (schema) => {
		required(schema.id);
		debounce(schema.id, 500);

		required(schema.arrival);

		validateAsync(schema.id, {
			params: ({ value, valueOf }) => {
				const val = value();
				if (valueOf(schema.uuid) ?? !val) return undefined;

				return val;
			},
			factory: (id) =>
				resource({
					params: id,
					loader: async ({ params: id }) => {
						const available = await firstValueFrom(this.recordsService.getByRecordsId(id));
						return available === null;
					},
				}),
			onSuccess: (result: boolean) => {
				if (!result) {
					return {
						kind: 'idExists',
					};
				}
				return null;
			},
			onError: (error: unknown) => {
				console.error('Validation error:', error);
				return null;
			},
		});
	});

	// NOTE: Temp fix until tuiComboBox works with signal forms
	public readonly specialtyControl = new FormControl<Specialty>(this.context.data?.specialty ?? 'internal', {
		nonNullable: true,
		validators: [Validators.required],
	});

	public readonly minDate = computed(() => this.recordModel().arrival);

	public save(): void {
		if (this.specialtyControl.invalid) return;

		submit(this.form, async (value) => {
			const raw = value().value();
			const uuid = raw.uuid;
			const arrival = toNativeDateTime(raw.arrival[0], raw.arrival[1]);
			const leaving = raw.leaving ? toNativeDateTime(raw.leaving[0], raw.leaving[1]) : undefined;
			const specialty = this.specialtyControl.value;
			this.context.completeWith({
				...raw,
				uuid: uuid ?? undefined,
				arrival,
				leaving,
				specialty,
			});
		});
	}

	public keyPress(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			this.save();
		}
	}

	public onFocused(event: FocusEvent): void {
		(event.target as HTMLInputElement).setSelectionRange(0, 0);
	}

	protected readonly stringifySpecialty = (item: string): string => this.translocoService.translate('specialty.' + item);
}
