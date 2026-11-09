import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
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
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err: unknown) => console.error(err));
