import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import { StoreStatuses } from '../../../domain/enums/store-status.enum';
import {
  TenantFormComponent,
  TenantFormMode,
  TenantFormValue,
} from './tenant-form.component';

const INITIAL_VALUE: TenantFormValue = {
  businessName: 'Bodega Don Pepe',
  taxId: '20512345678',
  address: 'Av. Los Olivos 450, Lima',
  status: StoreStatuses.INACTIVE,
};

function createFixture(options: {
  initialValue?: TenantFormValue | null;
  mode?: TenantFormMode;
  isSaving?: boolean;
} = {}): ComponentFixture<TenantFormComponent> {
  const fixture = TestBed.createComponent(TenantFormComponent);
  fixture.componentRef.setInput('initialValue', options.initialValue ?? null);
  fixture.componentRef.setInput('mode', options.mode ?? 'create');
  fixture.componentRef.setInput('isSaving', options.isSaving ?? false);
  fixture.detectChanges();
  return fixture;
}

function submitButton(fixture: ComponentFixture<TenantFormComponent>): HTMLButtonElement {
  const host = fixture.nativeElement as HTMLElement;
  const button = host.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button) {
    throw new Error('No se encontró el botón de guardado.');
  }
  return button;
}

describe('TenantFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  it('starts in create mode with empty required fields', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;

    expect(component.mode()).toBe('create');
    expect(component.isEdit()).toBe(false);
    expect(component.form.getRawValue()).toEqual({
      businessName: '',
      taxId: '',
      address: '',
      status: StoreStatuses.ACTIVE,
    });
    expect(submitButton(fixture).textContent).toContain('Guardar tienda');
  });

  it('blocks submission when mandatory fields are empty', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    const emitted: TenantFormValue[] = [];
    component.save.subscribe((value) => emitted.push(value));

    component.onSubmit();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'El nombre comercial es obligatorio.'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'El RUC es obligatorio.'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'La dirección es obligatoria.'
    );
  });

  it('rejects a RUC that is not exactly 11 digits', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    const emitted: TenantFormValue[] = [];
    component.save.subscribe((value) => emitted.push(value));
    component.form.setValue({
      businessName: 'Bodega Central',
      taxId: '2051234567',
      address: 'Av. Principal 100',
      status: StoreStatuses.ACTIVE,
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      'El RUC debe contener exactamente 11 dígitos.'
    );
  });

  it('loads initial values and displays edit mode', () => {
    const fixture = createFixture({
      initialValue: INITIAL_VALUE,
      mode: 'edit',
    });
    const component = fixture.componentInstance;

    expect(component.isEdit()).toBe(true);
    expect(component.form.getRawValue()).toEqual(INITIAL_VALUE);
    expect(submitButton(fixture).textContent).toContain('Guardar cambios');
  });

  it('emits valid create data', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    const emitted: TenantFormValue[] = [];
    component.save.subscribe((value) => emitted.push(value));
    const value: TenantFormValue = {
      businessName: 'Minimarket El Sol',
      taxId: '20698765432',
      address: 'Jr. Unión 120, Lima',
      status: StoreStatuses.ACTIVE,
    };
    component.form.setValue(value);

    component.onSubmit();

    expect(emitted).toEqual([value]);
  });

  it('emits valid edit data preserving the selected status', () => {
    const fixture = createFixture({
      initialValue: INITIAL_VALUE,
      mode: 'edit',
    });
    const component = fixture.componentInstance;
    const emitted: TenantFormValue[] = [];
    component.save.subscribe((value) => emitted.push(value));
    component.form.controls.businessName.setValue('Bodega Don Pepe Renovada');

    component.onSubmit();

    expect(emitted).toEqual([
      {
        ...INITIAL_VALUE,
        businessName: 'Bodega Don Pepe Renovada',
      },
    ]);
  });

  it('does not emit while saving and disables the actions', () => {
    const fixture = createFixture({ isSaving: true });
    const component = fixture.componentInstance;
    const emitted: TenantFormValue[] = [];
    component.save.subscribe((value) => emitted.push(value));
    component.form.setValue({
      businessName: 'Bodega Central',
      taxId: '20512345678',
      address: 'Av. Principal 100',
      status: StoreStatuses.ACTIVE,
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(submitButton(fixture).disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Guardando...');
  });

  it('emits cancellation when the user cancels', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;
    let cancelled = 0;
    component.cancelled.subscribe(() => {
      cancelled += 1;
    });

    component.onCancel();

    expect(cancelled).toBe(1);
  });
});
