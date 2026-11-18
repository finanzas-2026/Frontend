import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MobileNavigation } from './mobile-navigation';

describe('MobileNavigation', () => {
  let component: MobileNavigation;
  let fixture: ComponentFixture<MobileNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavigation],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileNavigation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
