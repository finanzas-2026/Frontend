import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { API_BASE_URL, ToastService } from '@shared/index';
import { PosCheckoutPageComponent } from './pos-checkout.component';
import { CartStore } from '../../state/cart.store';
import { provideFinancing } from '@financing';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository';
import { SalesHttpRepository } from '../../../infrastructure/http/sales-http.repository';

describe('PosCheckoutPageComponent', () => {
  let component: PosCheckoutPageComponent;
  let fixture: ComponentFixture<PosCheckoutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosCheckoutPageComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideFinancing(),
        CartStore,
        ToastService,
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
        { provide: SALES_REPOSITORY, useClass: SalesHttpRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PosCheckoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar con el carrito vacío', () => {
    expect(component.store.items().length).toBe(0);
    expect(component.store.canSubmit()).toBe(false);
  });
});
