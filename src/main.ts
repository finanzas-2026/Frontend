import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function prepareApp(): Promise<void> {
  if (environment.useFakeApi) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledFrame: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
  }
}

prepareApp()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err: unknown) => console.error(err));
