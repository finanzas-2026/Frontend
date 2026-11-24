import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { API_BASE_URL, Money, Rate } from '@shared/index';
import { DashboardPageComponent } from './dashboard.component';
import { provideAnalytics } from '../../../infrastructure/analytics.providers';
import { DashboardStore } from '../../state/dashboard.store';
import { DashboardKpis } from '../../../domain/model/dashboard-kpis.vo';
import { MonthlyFlow } from '../../../domain/model/monthly-flow.vo';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let store: DashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
        provideAnalytics(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(DashboardStore);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular alturas proporcionales de barra para el gráfico', () => {
    store.monthlyFlows.set([new MonthlyFlow({
      month: '2026-11',
      salesAmount: Money.fromDecimal(new Decimal(10000)),
      collectedAmount: Money.fromDecimal(new Decimal(20000)),
    })]);
    expect(component.getBarHeight(0)).toBe(0);
    expect(component.getBarHeight(10000)).toBe(50);
    expect(component.getBarHeight(20000)).toBe(100);
  });

  it('debe reflejar kpis en el template cuando están cargados', () => {
    const defaultRateResult = Rate.fromPercent(5.58);
    expect(defaultRateResult.isOk()).toBe(true);
    if (defaultRateResult.isErr()) return;

    const mockKpis = new DashboardKpis({
      totalRevenue: Money.fromDecimal(new Decimal(14850)),
      overduePortfolio: Money.fromDecimal(new Decimal(828.69)),
      activeAccounts: 42,
      defaultRate: defaultRateResult.value,
    });

    store.isLoading.set(false);
    store.kpis.set(mockKpis);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('14,850.00');
    expect(compiled.textContent).toContain('828.69');
    expect(compiled.textContent).toContain('42 clientes');
  });
});
