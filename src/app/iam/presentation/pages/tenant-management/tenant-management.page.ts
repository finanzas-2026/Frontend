import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '@shared/index';
import { StoreStatus, StoreStatuses } from '../../../domain/enums/store-status.enum';
import { Store } from '../../../domain/model/store.entity';
import { AuthStore } from '../../../application/auth.store';
import { TenantStore } from '../../../application/tenant.store';
import {
  TenantFormComponent,
  TenantFormMode,
  TenantFormValue,
} from '../../components/tenant-form/tenant-form.component';

const LOAD_ERROR_MESSAGE =
  'No se pudieron cargar los establecimientos. Intenta nuevamente.';
const SAVE_ERROR_MESSAGE =
  'No se pudo guardar el establecimiento. Intenta nuevamente.';
const STATUS_ERROR_MESSAGE =
  'No se pudo actualizar el estado del establecimiento. Intenta nuevamente.';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    TenantFormComponent,
  ],
  selector: 'app-tenant-management',
  styleUrl: './tenant-management.page.scss',
  templateUrl: './tenant-management.page.html',
})
export class TenantManagementPage implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);

  readonly canManage = computed(() => this.authStore.isSuperAdmin());
  readonly isFormOpen = signal(false);
  readonly editingStore = signal<Store | null>(null);
  readonly selectedStoreId = signal<number | null>(null);
  readonly isSaving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly formMode = computed<TenantFormMode>(() =>
    this.editingStore() ? 'edit' : 'create'
  );
  readonly formInitialValue = computed<TenantFormValue | null>(() => {
    const store = this.editingStore();
    return store ? this.toFormValue(store) : null;
  });

  ngOnInit(): void {
    if (this.canManage()) {
      void this.loadStores();
    }
  }

  async loadStores(): Promise<void> {
    this.loadError.set(null);

    try {
      await this.tenantStore.loadStores();
    } catch {
      this.loadError.set(LOAD_ERROR_MESSAGE);
    }
  }

  selectStore(store: Store): void {
    this.selectedStoreId.set(store.id);
  }

  openCreate(): void {
    this.resetFeedback();
    this.editingStore.set(null);
    this.isFormOpen.set(true);
  }

  openEdit(store: Store): void {
    this.resetFeedback();
    this.selectedStoreId.set(store.id);
    this.editingStore.set(store);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    if (this.isSaving()) {
      return;
    }

    this.isFormOpen.set(false);
    this.editingStore.set(null);
  }

  async onFormSave(value: TenantFormValue): Promise<void> {
    if (this.isSaving() || !this.canManage()) {
      return;
    }

    const editing = this.editingStore();
    const entity = editing ? this.toUpdatedStore(editing, value) : this.toNewStore(value);
    this.isSaving.set(true);
    this.resetFeedback();

    try {
      if (editing) {
        await this.tenantStore.updateStore(entity);
        this.actionMessage.set('Establecimiento actualizado correctamente.');
      } else {
        await this.tenantStore.createStore(entity);
        this.actionMessage.set('Establecimiento registrado correctamente.');
      }

      this.isFormOpen.set(false);
      this.editingStore.set(null);
    } catch {
      this.actionError.set(SAVE_ERROR_MESSAGE);
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleStatus(store: Store): Promise<void> {
    if (!this.canManage() || this.isSaving()) {
      return;
    }

    const nextStatus = store.isActive()
      ? StoreStatuses.INACTIVE
      : StoreStatuses.ACTIVE;
    this.isSaving.set(true);
    this.resetFeedback();

    try {
      await this.tenantStore.updateStore(this.withStatus(store, nextStatus));
      this.actionMessage.set('Estado del establecimiento actualizado.');
    } catch {
      this.actionError.set(STATUS_ERROR_MESSAGE);
    } finally {
      this.isSaving.set(false);
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

  statusClass(status: StoreStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  private resetFeedback(): void {
    this.actionError.set(null);
    this.actionMessage.set(null);
  }

  private toFormValue(store: Store): TenantFormValue {
    return {
      businessName: store.businessName,
      taxId: store.taxId,
      address: store.address,
      status: store.status,
    };
  }

  private toNewStore(value: TenantFormValue): Store {
    // Domain requires a positive identifier and the current persistence
    // contract does not expose server-side id generation. The next local id is
    // provisional until the backend assigns identifiers.
    return new Store({
      id: this.nextStoreId(),
      businessName: value.businessName.trim(),
      taxId: value.taxId.trim(),
      address: value.address.trim(),
      createdAt: new Date(),
      status: value.status,
    });
  }

  private toUpdatedStore(store: Store, value: TenantFormValue): Store {
    return new Store({
      id: store.id,
      businessName: value.businessName.trim(),
      taxId: value.taxId.trim(),
      address: value.address.trim(),
      createdAt: store.createdAt,
      status: value.status,
    });
  }

  private withStatus(store: Store, status: StoreStatus): Store {
    return new Store({
      id: store.id,
      businessName: store.businessName,
      taxId: store.taxId,
      address: store.address,
      createdAt: store.createdAt,
      status,
    });
  }

  private nextStoreId(): number {
    return (
      this.tenantStore.stores().reduce(
        (highest, current) => Math.max(highest, current.id),
        0
      ) + 1
    );
  }
}
