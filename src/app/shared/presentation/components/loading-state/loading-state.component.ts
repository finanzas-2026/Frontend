import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-state-container" role="status" aria-live="polite">
      <mat-spinner diameter="40" aria-label="Cargando" />
      <p class="loading-message">{{ message() }}</p>
    </div>
  `,
  styles: [
    `
      .loading-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1.5rem;
        gap: 1rem;
      }
      .loading-message {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  readonly message = input<string>('Cargando información...');
}
