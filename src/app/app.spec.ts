import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/angular';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('App', () => {
  it('should render the root router outlet', async () => {
    const { container } = await render(App, {
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    expect(container.querySelector('router-outlet')).toBeTruthy();
  });
});
