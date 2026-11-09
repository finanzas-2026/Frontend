import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { API_BASE_URL, Money } from '@shared/index';
import { MovementsAuditPageComponent } from './movements-audit.component';
import { provideAnalytics } from '../../../infrastructure/analytics.providers';
import { DashboardStore } from '../../state/dashboard.store';
import { AuditMovement } from '../../../domain/model/audit-movement.entity';

describe('MovementsAuditPageComponent', () => {
  let component: MovementsAuditPageComponent;
  let fixture: ComponentFixture<MovementsAuditPageComponent>;
  let store: DashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementsAuditPageComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
        provideAnalytics(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementsAuditPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(DashboardStore);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar las 5 columnas requeridas para auditoría', () => {
    expect(component.columns.length).toBe(5);
    const keys = component.columns.map((c) => c.key);
    expect(keys).toEqual(['timestamp', 'eventType', 'customerName', 'description', 'amount']);
  });

  it('debe mapear movimientos del store a filas de tabla con importes formateados', () => {
    const mockMovement = new AuditMovement({
      id: 1,
      timestamp: '2026-11-09T10:00:00Z',
      eventType: 'SALE_CREATED',
      customerName: 'Juan Pérez',
      description: 'Venta a crédito VTA-2026-0001',
      amount: Money.fromDecimal(new Decimal(1500)),
    });

    store.movements.set([mockMovement]);
    fixture.detectChanges();

    const items = component.tableItems();
    expect(items.length).toBe(1);
    expect(items[0]?.['amount']).toBe('S/ 1,500.00');
    expect(items[0]?.['customerName']).toBe('Juan Pérez');
  });
});
