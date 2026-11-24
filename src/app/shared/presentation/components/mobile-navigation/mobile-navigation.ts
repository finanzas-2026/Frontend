import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { UserRoles } from '../../../../iam/domain/constants/user-roles.constant';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-mobile-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.css',
})
export class MobileNavigation {
  readonly authStore = inject(AuthStore);
  readonly UserRoles = UserRoles;
}
