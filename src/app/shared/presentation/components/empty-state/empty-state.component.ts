import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIconComponent, UiIconName } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [UiIconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<UiIconName>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>();
}
