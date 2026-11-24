import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatMenuModule, UiIconComponent],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {
  readonly menuToggle = output<void>();
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  toggleMenu(): void {
    this.menuToggle.emit();
  }

  async signOut(): Promise<void> {
    this.authStore.signOut();
    await this.router.navigateByUrl('/iam/sign-in');
  }
}
