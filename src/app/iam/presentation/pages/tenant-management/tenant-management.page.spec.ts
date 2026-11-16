import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreStatuses } from '../../../domain/enums/store-status.enum';
import { Store } from '../../../domain/model/store.entity';
import { AuthStore } from '../../../application/auth.store';
import { TenantStore } from '../../../application/tenant.store';
import {
  TenantFormComponent,
  TenantFormValue,
} from '../../components/tenant-form/tenant-form.component';
import { TenantManagementPage } from './tenant-management.page';

function store(
  overrides: Partial<ConstructorParameters<typeof Store>[0]> = {}
): Store {
  return new Store({
    id: 1,
    businessName: 'Bodega Don Pepe',
    taxId: '20512345678',
    address: 'Av. Los Olivos 450, Lima',
    createdAt: new Date('2026-10-01T08:00:00Z'),
    status: StoreStatuses.ACTIVE,
    ...overrides,
  });
}

function formValue(overrides: Partial<TenantFormValue> = {}): TenantFormValue {
  return {
    businessName: 'Minimarket El Sol',
    taxId: '20698765432',
    address: 'Jr. Unión 120, Lima',
    status: StoreStatuses.ACTIVE,
    ...overrides,
  };
}

describe('TenantManagementPage', () => {
  let fixture: ComponentFixture<TenantManagementPage>;
  let component: TenantManagementPage;
  let stores: WritableSignal<readonly Store[]>;
  let isLoading: WritableSignal<boolean>;
  let canManage: WritableSignal<boolean>;
  let tenantStore: {
    stores: WritableSignal<readonly Store[]>;
    isLoading: WritableSignal<boolean>;
    loadStores: ReturnType<typeof vi.fn>;
    createStore: ReturnType<typeof vi.fn>;
    updateStore: ReturnType<typeof vi.fn>;
  };
  let createdEntity: Store | null;
  let updatedEntity: Store | null;

  beforeEach(async () => {
    stores = signal<readonly Store[]>([]);
    isLoading = signal(false);
    canManage = signal(true);
    createdEntity = null;
    updatedEntity = null;
    tenantStore = {
      stores,
      isLoading,
      loadStores: vi.fn(async () => [...stores()]),
      createStore: vi.fn(async (entity: Store) => {
        createdEntity = entity;
        return entity;
      }),
      updateStore: vi.fn(async (entity: Store) => {
        updatedEntity = entity;
        return entity;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TenantManagementPage],
      providers: [
        provideNoopAnimations(),
        { provide: TenantStore, useValue: tenantStore },
        { provide: AuthStore, useValue: { isSuperAdmin: canManage } },
      ],
    }).compileComponents();
  });

  async function createPage(): Promise<void> {
    fixture = TestBed.createComponent(TenantManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function buttonByText(text: string): HTMLButtonElement | null {
    const buttons = host().querySelectorAll<HTMLButtonElement>('button');
    for (const button of Array.from(buttons)) {
      if (button.textContent?.includes(text)) {
        return button;
      }
    }
    return null;
  }

  function tenantForm(): TenantFormComponent {
    const debugElement = fixture.debugElement.query(
      By.directive(TenantFormComponent)
    );
    if (!debugElement) {
      throw new Error('No se encontró el formulario de establecimiento.');
    }
    return debugElement.componentInstance;
  }

  it('loads and renders the registered establishments', async () => {
    stores.set([
      store(),
      store({
        id: 2,
        businessName: 'Minimarket El Sol',
        taxId: '20698765432',
        address: 'Jr. Unión 120, Lima',
        status: StoreStatuses.INACTIVE,
      }),
    ]);
    await createPage();

    expect(tenantStore.loadStores).toHaveBeenCalledOnce();
    const text = host().textContent as string;
    expect(text).toContain('Bodega Don Pepe');
    expect(text).toContain('20512345678');
    expect(text).toContain('Minimarket El Sol');
    expect(text).toContain('Inactiva');
  });

  it('shows an empty state when no establishments exist', async () => {
    await createPage();

    expect(host().textContent).toContain(
      'Aún no hay tiendas registradas'
    );
  });

  it('shows a loading indicator while establishments load', async () => {
    isLoading.set(true);
    await createPage();

    expect(host().textContent).toContain(
      'Cargando establecimientos...'
    );
  });

  it('opens the creation form from the header action', async () => {
    await createPage();

    const createButton = buttonByText('Nueva tienda');
    expect(createButton).not.toBeNull();
    createButton?.click();
    fixture.detectChanges();

    expect(component.isFormOpen()).toBe(true);
    expect(fixture.debugElement.query(By.directive(TenantFormComponent))).not.toBeNull();
  });

  it('registers an establishment through TenantStore', async () => {
    stores.set([store()]);
    await createPage();
    component.openCreate();
    fixture.detectChanges();

    tenantForm().save.emit(formValue());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(tenantStore.createStore).toHaveBeenCalledOnce();
    expect(createdEntity).toBeInstanceOf(Store);
    expect(createdEntity?.id).toBe(2);
    expect(createdEntity?.businessName).toBe('Minimarket El Sol');
    expect(createdEntity?.taxId).toBe('20698765432');
    expect(createdEntity?.status).toBe(StoreStatuses.ACTIVE);
    expect(host().textContent).toContain(
      'Establecimiento registrado correctamente.'
    );
    expect(component.isFormOpen()).toBe(false);
  });

  it('updates an establishment while preserving its identity', async () => {
    stores.set([store()]);
    await createPage();
    const editButton = host().querySelector<HTMLButtonElement>(
      'button[aria-label="Editar Bodega Don Pepe"]'
    );
    editButton?.click();
    fixture.detectChanges();

    tenantForm().save.emit(formValue({ businessName: 'Bodega Renovada' }));
    await fixture.whenStable();

    expect(tenantStore.updateStore).toHaveBeenCalledOnce();
    expect(updatedEntity).toBeInstanceOf(Store);
    expect(updatedEntity?.id).toBe(1);
    expect(updatedEntity?.businessName).toBe('Bodega Renovada');
    expect(updatedEntity?.createdAt).toEqual(
      new Date('2026-10-01T08:00:00Z')
    );
  });

  it('updates the operating status of an establishment', async () => {
    stores.set([store()]);
    await createPage();

    await component.toggleStatus(store());

    expect(tenantStore.updateStore).toHaveBeenCalledOnce();
    expect(updatedEntity).toBeInstanceOf(Store);
    expect(updatedEntity?.id).toBe(1);
    expect(updatedEntity?.status).toBe(StoreStatuses.INACTIVE);
    expect(updatedEntity?.isActive()).toBe(false);
  });

  it('shows a communication error when loading fails', async () => {
    tenantStore.loadStores.mockRejectedValue(new Error('network'));
    await createPage();

    expect(host().textContent).toContain(
      'No se pudo cargar la información'
    );
    expect(host().textContent).not.toContain('network');
  });

  it('shows an error when an establishment cannot be saved', async () => {
    tenantStore.createStore.mockRejectedValue(new Error('server detail'));
    await createPage();
    component.openCreate();
    fixture.detectChanges();

    tenantForm().save.emit(formValue());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host().textContent).toContain(
      'No se pudo guardar el establecimiento.'
    );
    expect(host().textContent).not.toContain('server detail');
  });

  it('restricts management actions to the platform super admin', async () => {
    canManage.set(false);
    stores.set([store()]);
    await createPage();

    expect(tenantStore.loadStores).not.toHaveBeenCalled();
    expect(host().textContent).toContain('Acceso restringido');
    expect(buttonByText('Nueva tienda')).toBeNull();
    expect(host().textContent).not.toContain('Bodega Don Pepe');
  });

  it('marks the selected establishment without navigating away', async () => {
    stores.set([store()]);
    await createPage();

    const selectButton = buttonByText('Bodega Don Pepe');
    selectButton?.click();
    fixture.detectChanges();

    expect(component.selectedStoreId()).toBe(1);
  });
});
