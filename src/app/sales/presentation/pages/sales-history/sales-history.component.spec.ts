import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { API_BASE_URL } from '@shared/index';
import { SalesHistoryPageComponent } from './sales-history.component';
import { SALES_REPOSITORY } from '../../../domain/repositories/sales.repository';
import { SalesHttpRepository } from '../../../infrastructure/http/sales-http.repository';

describe('SalesHistoryPageComponent', () => {
  let component: SalesHistoryPageComponent;
  let fixture: ComponentFixture<SalesHistoryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesHistoryPageComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
        { provide: SALES_REPOSITORY, useClass: SalesHttpRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar las columnas del historial', () => {
    expect(component.columns.length).toBe(5);
    expect(component.columns[0]?.key).toBe('code');
  });
});
