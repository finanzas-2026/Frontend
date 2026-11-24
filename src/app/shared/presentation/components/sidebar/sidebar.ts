import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { UserRoles } from '../../../../iam/domain/constants/user-roles.constant';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly isOpen = input<boolean>(true);
  readonly authStore = inject(AuthStore);
  readonly UserRoles = UserRoles;
}
