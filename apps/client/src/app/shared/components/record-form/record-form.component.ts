import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiDialogContext, TuiError, TuiTextfield } from '@taiga-ui/core';

import { TuiSelectModule, TuiTextfieldControllerModule, TuiInputDateTimeModule, TuiComboBoxModule } from '@taiga-ui/legacy';

import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TuiAutoFocus, TuiDay, TuiTime } from '@taiga-ui/cdk';
import { TuiDataListWrapper, TuiFilterByInputPipe, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { IRecordForm } from '../../models/record-form.model';
import { RecordService } from '../../services';
import { toSignal } from '@angular/core/rxjs-interop';
import { IRecord, SPECIALTIES, Specialty } from '../../models';
import { idExitsValidator } from './id-exists.validator';

const angularImports = [ReactiveFormsModule, NgTemplateOutlet];
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
	imports: [...angularImports, ...thirdPartyImports, ...taigaUiImports],
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
								[tuiAutoFocus]="autoFocus ?? false"
								[formControlName]="formControlName"
								[min]="formControlName === 'arrival' ? null : minDate()"
								[tuiTextfieldLabelOutside]="true"
								[tuiTextfieldCleaner]="true">
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
		@reference '../../../../styles.css';

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
			validators: [Validators.required],
			asyncValidators: this.context.data?.id ? [] : [idExitsValidator(this.recordsService)],
			updateOn: this.context.data?.id ? 'change' : 'blur',
		}),
		arrival: new FormControl<[TuiDay, TuiTime]>(this.getTuiDayTime(this.context.data?.arrival ?? new Date()), {
			nonNullable: true,
		}),
		leaving: new FormControl<[TuiDay, TuiTime] | null>(this.context.data?.leaving ? this.getTuiDayTime(this.context.data.leaving) : null),
		from: new FormControl<string>(this.context.data?.from ?? '', { nonNullable: true }),
		to: new FormControl<string>(this.context.data?.to ?? '', { nonNullable: true }),
		specialty: new FormControl<Specialty>(this.context.data?.specialty ?? 'internal', { nonNullable: true }),
	});

	public readonly minDate = toSignal(this.form.controls.arrival.valueChanges.pipe(), { initialValue: this.form.controls.arrival.value });

	public save(): void {
		const value = this.form.getRawValue();
		const uuid = value.uuid;
		const arrival = this.toNativeDateTime(value.arrival[0], value.arrival[1]);
		const leaving = value.leaving ? this.toNativeDateTime(value.leaving[0], value.leaving[1]) : undefined;

		this.context.completeWith({
			...value,
			uuid: uuid ?? undefined,
			arrival,
			leaving,
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

	private getTuiDayTime(date: Date): [TuiDay, TuiTime] {
		return [this.getTuiDay(date), this.getTuiTime(date)];
	}

	private getTuiDay(date: Date): TuiDay {
		return new TuiDay(date.getFullYear(), date.getMonth(), date.getDate());
	}

	private getTuiTime(date: Date): TuiTime {
		return new TuiTime(date.getHours(), date.getMinutes(), date.getSeconds());
	}

	private toNativeDateTime(day: TuiDay, time: TuiTime): Date {
		return new Date(day.year ?? 0, day.month ?? 0, day.day ?? 0, time.hours, time.minutes, time.seconds);
	}
}
