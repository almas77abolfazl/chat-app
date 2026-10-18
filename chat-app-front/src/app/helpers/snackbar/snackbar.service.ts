import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

export type SnackBarType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: SnackBarType = 'info', duration: number = 3000): MatSnackBarRef<any> {
    const horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    const verticalPosition: MatSnackBarVerticalPosition = 'top';

    const panelClass = `snackbar-${type}`;

    return this.snackBar.open(message, 'بستن', {
      duration,
      horizontalPosition,
      verticalPosition,
      panelClass,
    });
  }

  success(message: string, duration?: number): MatSnackBarRef<any> {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): MatSnackBarRef<any> {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): MatSnackBarRef<any> {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): MatSnackBarRef<any> {
    return this.show(message, 'info', duration);
  }
}
