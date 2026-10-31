import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { TranslationService } from '../translation.service';

export type SnackBarType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translationService = inject(TranslationService);

  show(
    messageOrKey: string,
    type: SnackBarType = 'info',
    duration: number = 3000,
    params?: Record<string, string | number>,
  ): MatSnackBarRef<any> {
    const horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    const verticalPosition: MatSnackBarVerticalPosition = 'top';

    const panelClass = `snackbar-${type}`;
    const message = this.translationService.t(messageOrKey, params) || messageOrKey;
    const closeText = this.translationService.t('common.close') || 'Close';

    return this.snackBar.open(message, closeText, {
      duration,
      horizontalPosition,
      verticalPosition,
      panelClass,
    });
  }

  success(messageOrKey: string, duration?: number, params?: Record<string, string | number>): MatSnackBarRef<any> {
    return this.show(messageOrKey, 'success', duration, params);
  }

  error(messageOrKeyOrError: any, duration?: number, params?: Record<string, string | number>): MatSnackBarRef<any> {
    let resolvedMessage: string;
    if (typeof messageOrKeyOrError === 'object' && messageOrKeyOrError !== null) {
      resolvedMessage = this.translationService.translateError(messageOrKeyOrError);
    } else {
      resolvedMessage = this.translationService.t(String(messageOrKeyOrError || ''), params);
    }
    return this.show(resolvedMessage, 'error', duration);
  }

  warning(messageOrKey: string, duration?: number, params?: Record<string, string | number>): MatSnackBarRef<any> {
    return this.show(messageOrKey, 'warning', duration, params);
  }

  info(messageOrKey: string, duration?: number, params?: Record<string, string | number>): MatSnackBarRef<any> {
    return this.show(messageOrKey, 'info', duration, params);
  }
}
