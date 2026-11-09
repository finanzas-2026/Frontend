import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  showSuccess(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showError(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showInfo(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
