import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  StoreStatus,
  StoreStatuses,
} from '../../../domain/enums/store-status.enum';

export type TenantFormMode = 'create' | 'edit';

export interface TenantFormValue {
  readonly businessName: string;
  readonly taxId: string;
  readonly address: string;
  readonly status: StoreStatus;
}

const TAX_ID_PATTERN = /^\d{11}$/;

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  selector: 'app-tenant-form',
  styleUrl: './tenant-form.component.scss',
  templateUrl: './tenant-form.component.html',
})
export class TenantFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly initialValue = input<TenantFormValue | null>(null);
  readonly mode = input<TenantFormMode>('create');
  readonly isSaving = input(false);

  readonly save = output<TenantFormValue>();
  readonly cancelled = output<void>();

  readonly statuses: readonly StoreStatus[] = Object.values(StoreStatuses);
  readonly isEdit = computed(() => this.mode() === 'edit');

  readonly form = this.formBuilder.nonNullable.group({
    businessName: ['', [Validators.required]],
    taxId: ['', [Validators.required, Validators.pattern(TAX_ID_PATTERN)]],
    address: ['', [Validators.required]],
    status: [StoreStatuses.ACTIVE as StoreStatus, [Validators.required]],
  });

  ngOnInit(): void {
    const value = this.initialValue();

    if (value) {
      this.form.reset(value);
    }
  }

  statusLabel(status: StoreStatus): string {
    switch (status) {
      case StoreStatuses.ACTIVE:
        return 'Activa';
      case StoreStatuses.INACTIVE:
        return 'Inactiva';
      case StoreStatuses.SUSPENDED:
        return 'Suspendida';
      default:
        return status;
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    this.save.emit(this.form.getRawValue());
  }

  onCancel(): void {
    if (!this.isSaving()) {
      this.cancelled.emit();
    }
  }
}
