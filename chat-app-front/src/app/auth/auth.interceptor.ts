import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';

let refreshTokenObservable: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // Skip auth header for asset requests (i18n JSON, etc.)
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  // Do not attach Authorization header to public auth endpoints
  const isAuthEndpoint =
    req.url.includes('auth/send-code') ||
    req.url.includes('auth/verify-code') ||
    req.url.includes('auth/refresh');

  const token = authService.getAuthToken();
  if (token && !isAuthEndpoint) {
    req = req.clone({ setHeaders: { authorization: 'Bearer ' + token } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        return handle401Error(req, next, authService);
      }
      if (error.status === 404 && req.url.includes('/avatar')) {
        return throwError(() => new Error(error.message));
      }
      console.error('Request failed:', error.message);
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  // If request is logout, clean session without retrying
  if (req.url.includes('auth/logout')) {
    authService.clearSession();
    return throwError(() => new Error('Session terminated'));
  }

  const refreshToken = authService.getRefreshToken();
  if (!refreshToken) {
    authService.clearSession();
    return throwError(() => new Error('No refresh token available'));
  }

  // Deduplicate concurrent 401s: all waiting requests share a single refresh call
  if (!refreshTokenObservable) {
    refreshTokenObservable = authService.refreshToken().pipe(
      map((res: { access_token: string; refreshToken?: string }) => {
        const newToken = res.access_token;
        localStorage.setItem('auth_token', newToken);
        if (res.refreshToken) {
          localStorage.setItem('refresh_token', res.refreshToken);
        }
        authService.syncUserSignal();
        return newToken;
      }),
      shareReplay(1),
      catchError((refreshErr) => {
        authService.clearSession();
        return throwError(() => refreshErr);
      }),
      finalize(() => {
        refreshTokenObservable = null;
      })
    );
  }

  return refreshTokenObservable.pipe(
    switchMap((newToken) => {
      req = req.clone({ setHeaders: { authorization: 'Bearer ' + newToken } });
      return next(req);
    })
  );
}
