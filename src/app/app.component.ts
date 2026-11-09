import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="app-root-container">
      <header class="app-header">
        <h1>Sistema de Crédito de Proximidad</h1>
      </header>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .app-root-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .app-header {
        padding: 1rem;
        background: #1976d2;
        color: #fff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly title = 'Sistema de Crédito de Proximidad';
}
