import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShellComponent } from './shared/presentation/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell />`,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly title = 'Sistema de Crédito de Proximidad';
}
