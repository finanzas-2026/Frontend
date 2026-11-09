import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  it('should render the app root container', async () => {
    await render(AppComponent, {
      providers: [provideRouter([])],
    });
    expect(screen.getByRole('main')).toBeTruthy();
  });
});
