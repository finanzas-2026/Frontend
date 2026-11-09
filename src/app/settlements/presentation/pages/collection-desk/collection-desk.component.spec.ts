import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { API_BASE_URL, ToastService } from '@shared/index';
import { CollectionDeskPageComponent } from './collection-desk.component';
import { CollectionStore } from '../../state/collection.store';
import { SETTLEMENTS_REPOSITORY } from '../../../domain/repositories/settlements.repository';
import { SettlementsHttpRepository } from '../../../infrastructure/http/settlements-http.repository';

describe('CollectionDeskPageComponent', () => {
  let component: CollectionDeskPageComponent;
  let fixture: ComponentFixture<CollectionDeskPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDeskPageComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        CollectionStore,
        ToastService,
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
        { provide: SETTLEMENTS_REPOSITORY, useClass: SettlementsHttpRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionDeskPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
