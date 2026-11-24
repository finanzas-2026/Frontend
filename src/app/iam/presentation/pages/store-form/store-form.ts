import { UiIconComponent } from '../../../../shared/presentation/components/ui-icon/ui-icon.component';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeaderComponent, ToastService } from '@shared/index';
import { TenantStore } from '../../../application/stores/tenant.store';
import { StoreStatus, StoreStatuses } from '../../../domain/enums/store-status.enum';
import { Store } from '../../../domain/model/store.entity';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [UiIconComponent, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, PageHeaderComponent],
  templateUrl: './store-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFormPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly store = inject(TenantStore);
  readonly tenantId = signal<number | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly isEdit = computed(() => this.tenantId() !== null);
  readonly statuses = [
    { value: StoreStatuses.ACTIVE, label: 'Activa' },
    { value: StoreStatuses.SUSPENDED, label: 'Suspendida' },
    { value: StoreStatuses.INACTIVE, label: 'Inactiva' },
  ];

  readonly form = this.formBuilder.nonNullable.group({
    businessName: ['', Validators.required],
    taxId: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    address: ['', Validators.required],
    phoneNumber: [''],
    status: [StoreStatuses.ACTIVE as StoreStatus, Validators.required],
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) return;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('El identificador de la tienda no es válido.');
      return;
    }
    this.tenantId.set(id);
    void this.loadTenant(id);
  }

  async loadTenant(id: number): Promise<void> {
    try {
      const tenant = await this.store.loadTenantById(id);
      this.form.patchValue({
        businessName: tenant.businessName,
        taxId: tenant.taxId,
        address: tenant.address,
        phoneNumber: tenant.phoneNumber ?? '',
        status: tenant.status,
      });
    } catch {
      this.loadError.set(this.store.error() ?? 'No se pudo cargar la tienda.');
    }
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.tenantId()) return;
    const existing = this.store.tenants().find((tenant) => tenant.id === this.tenantId());
    if (!existing) return;
    const value = this.form.getRawValue();
    const updated: Store = {
      ...existing,
      businessName: value.businessName.trim(),
      taxId: value.taxId.trim(),
      address: value.address.trim(),
      phoneNumber: value.phoneNumber.trim() || undefined,
      status: value.status,
    };
    try {
      await this.store.updateTenant(updated);
      this.toast.success('Tienda actualizada correctamente.');
      await this.router.navigateByUrl('/stores/list');
    } catch {
      this.loadError.set(this.store.error() ?? 'No se pudo actualizar la tienda.');
    }
  }
}
