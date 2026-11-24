import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { UiIconComponent } from '../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-toast-content',
  imports: [UiIconComponent],
  template: `
    <div class="toast-content">
      <span>{{ message }}</span>
      <button type="button" aria-label="Cerrar notificación" (click)="dismiss()">
        <app-ui-icon name="close" [size]="18" aria-hidden="true" />
      </button>
    </div>
  `,
  styles: [`
    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem 0.375rem 0.875rem;
    }

    span {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    button {
      display: grid;
      place-items: center;
      flex: none;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--toast-accent, currentColor);
      cursor: pointer;
    }

    button:hover {
      background: rgb(15 23 42 / 8%);
    }

    button:focus-visible {
      outline: 2px solid currentColor;
    }
  `],
})
class ToastContentComponent {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<ToastContentComponent>);

  protected dismiss(): void {
    this.snackBarRef.dismissWithAction();
  }
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  showSuccess(message: string, duration = 3000): void {
    this.snackBar.openFromComponent(ToastContentComponent, {
      data: message,
      announcementMessage: message,
      duration,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  success(message: string, duration = 3000): void {
    this.showSuccess(message, duration);
  }

  showError(message: string, duration = 5000): void {
    this.snackBar.openFromComponent(ToastContentComponent, {
      data: message,
      announcementMessage: message,
      duration,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string, duration = 5000): void {
    this.showError(message, duration);
  }

  showInfo(message: string, duration = 3000): void {
    this.snackBar.openFromComponent(ToastContentComponent, {
      data: message,
      announcementMessage: message,
      duration,
      panelClass: ['toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(message: string, duration = 3000): void {
    this.showInfo(message, duration);
  }
}
