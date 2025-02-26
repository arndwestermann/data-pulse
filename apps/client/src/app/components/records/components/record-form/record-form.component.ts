import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiDialogContext, TuiError, TuiTextfield } from '@taiga-ui/core';

import { TuiSelectModule, TuiTextfieldControllerModule, TuiInputDateTimeModule, TuiComboBoxModule } from '@taiga-ui/legacy';

import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TuiAutoFocus, TuiDay, TuiTime } from '@taiga-ui/cdk';
import { TuiDataListWrapper, TuiFilterByInputPipe, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { IRecordForm } from '../../models/record-form.model';
import { NativeDatetimeTransformerDirective } from '../../../../shared/directives';
import { RecordService } from '../../../../shared/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { IRecord, SPECIALTIES, Specialty } from '../../../../shared/models';
import { idExitsValidator } from './id-exists.validator';

const angularImports = [ReactiveFormsModule, NgTemplateOutlet];
const firstPartyImports = [NativeDatetimeTransformerDirective];
const thirdPartyImports = [TranslocoDirective];
const taigaUiImports = [
	TuiButton,
	TuiSelectModule,
	TuiDataListWrapper,
	TuiTextfieldControllerModule,
	TuiTextfield,
	TuiInputDateTimeModule,
	TuiFilterByInputPipe,
	TuiStringifyContentPipe,
	TuiComboBoxModule,
	TuiAutoFocus,
	TuiError,
];

@Component({
	selector: 'dp-record-form',
	imports: [...angularImports, ...firstPartyImports, ...thirdPartyImports, ...taigaUiImports],
	template: `
		<form class="flex flex-col gap-2" [formGroup]="form" *transloco="let transloco">
			<div class="w-full">
				<ng-container *ngTemplateOutlet="inputTemplate; context: { formControlName: 'id', type: 'text', autoFocus: true }" />
				@if (form.controls.id.hasError('idExists')) {
					<tui-error [error]="transloco('validation.idExists')" />
				}
			</div>
			<div class="flex gap-2">
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { formControlName: 'arrival', type: 'datetime' }" />
				</div>
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { formControlName: 'leaving', type: 'datetime' }" />
				</div>
			</div>
			<div class="flex gap-2">
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { formControlName: 'from', type: 'text' }" />
				</div>
				<div class="w-1/2">
					<ng-container *ngTemplateOutlet="inputTemplate; context: { formControlName: 'to', type: 'date' }" />
				</div>
			</div>

			<ng-container *ngTemplateOutlet="dropdownTemplate; context: { formControlName: 'specialty', array: specialties() }" />

			<button tuiButton class="w-full" type="button" size="m" [disabled]="form.invalid" (click)="save()">
				<span class="mr-2 font-normal">{{ transloco('general.save') }}</span>
			</button>

			<ng-template let-formControlName="formControlName" let-type="type" let-array="array" let-autoFocus="autoFocus" #inputTemplate>
				<label>
					{{ transloco('records.' + formControlName) }}
					@switch (type) {
						@case ('datetime') {
							<tui-input-date-time
								toNativeDatetime
								[tuiAutoFocus]="autoFocus ?? false"
								[formControlName]="formControlName"
								[min]="formControlName === 'arrival' ? null : minDate()"
								[tuiTextfieldLabelOutside]="true">
								<input tuiTextfieldLegacy (focus)="onFocused($event)" />
							</tui-input-date-time>
						}
						@default {
							<tui-textfield>
								<input
									tuiTextfield
									[tuiAutoFocus]="autoFocus ?? false"
									[formControlName]="formControlName"
									type="text"
									(keypress)="keyPress($event)" />
							</tui-textfield>
						}
					}
				</label>
			</ng-template>

			<ng-template let-formControlName="formControlName" let-array="array" #dropdownTemplate>
				<label>
					{{ transloco('records.' + formControlName) }}
					<tui-combo-box [formControlName]="formControlName" [stringify]="stringifySpecialty" [tuiTextfieldLabelOutside]="true">
						<input tuiTextfieldLegacy (keypress)="keyPress($event)" />
						<tui-data-list-wrapper *tuiDataList [items]="array | tuiFilterByInput" [itemContent]="stringifySpecialty | tuiStringifyContent" />
					</tui-combo-box>
				</label>
			</ng-template>
		</form>
	`,
	styles: `
		@reference '../../../../../styles.css';

		:host {
			@apply block;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordFormComponent {
	private readonly translocoService = inject(TranslocoService);
	private readonly recordsService = inject(RecordService);

	public readonly context = inject<TuiDialogContext<IRecord, IRecord | null>>(POLYMORPHEUS_CONTEXT);
	public readonly specialties = signal(SPECIALTIES);

	public readonly form = new FormGroup<IRecordForm>({
		uuid: new FormControl<string | null>(this.context.data?.uuid ?? null),
		id: new FormControl<string>(this.context.data?.id ?? '', {
			nonNullable: true,
			asyncValidators: this.context.data?.id ? [] : [idExitsValidator(this.recordsService)],
			updateOn: 'blur',
		}),
		arrival: new FormControl<Date>(this.context.data?.arrival ?? new Date(), { nonNullable: true }),
		leaving: new FormControl<Date>(this.context.data?.leaving ?? new Date(), { nonNullable: true }),
		from: new FormControl<string>(this.context.data?.from ?? '', { nonNullable: true }),
		to: new FormControl<string>(this.context.data?.to ?? '', { nonNullable: true }),
		specialty: new FormControl<Specialty>(this.context.data?.specialty ?? 'internal', { nonNullable: true }),
	});

	public readonly arrivalChange = toSignal(this.form.controls.arrival.valueChanges, { initialValue: this.form.controls.arrival.value });

	public readonly minDate = computed(
		() =>
			[
				new TuiDay(this.arrivalChange().getFullYear(), this.arrivalChange().getMonth(), this.arrivalChange().getDate()),
				new TuiTime(this.arrivalChange().getHours(), this.arrivalChange().getMinutes(), this.arrivalChange().getSeconds()),
			] satisfies [TuiDay, TuiTime],
	);

	public save(): void {
		const value = this.form.getRawValue();
		const uuid = value.uuid;
		const record: IRecord = {
			...this.form.getRawValue(),
			uuid: uuid ?? undefined,
		};
		this.context.completeWith(record);
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
