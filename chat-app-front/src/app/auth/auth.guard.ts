import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);

  const isLoggedIn = await authService.isLoggedIn();
  if (isLoggedIn) return true;
  else {
    authService.logout();
    return false;
  }
};
