import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('AppComponent', () => {
  it('should render the app root container and shell', async () => {
    await render(AppComponent, {
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByText('Crédito Proximidad')).toBeTruthy();
  });
});
