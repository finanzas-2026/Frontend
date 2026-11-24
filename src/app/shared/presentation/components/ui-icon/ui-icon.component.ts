import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiIconName =
  | 'add'
  | 'analytics'
  | 'arrow-left'
  | 'arrow-right'
  | 'audit'
  | 'cart-remove'
  | 'cart'
  | 'check-circle'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'edit'
  | 'error'
  | 'eye-off'
  | 'eye'
  | 'receipt'
  | 'calculator'
  | 'credit-card'
  | 'folder'
  | 'inbox'
  | 'lock'
  | 'logout'
  | 'user'
  | 'package'
  | 'clipboard'
  | 'search-off'
  | 'search'
  | 'store'
  | 'tag'
  | 'trending-up'
  | 'trending-down'
  | 'users'
  | 'warning'
  | 'printer'
  | 'menu'
  | 'close'
  | 'blocked';

@Component({
  selector: 'app-ui-icon',
  standalone: true,
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  readonly name = input.required<UiIconName>();
  readonly size = input(20);
}
