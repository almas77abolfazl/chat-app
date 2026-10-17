import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const token = authService.getAuthToken();
  if (token) {
    req = req.clone({ setHeaders: { authorization: 'Bearer ' + token } });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) return handle401Error(req, next, authService);
      console.error('Request failed:', error.message);
      return throwError(() => new Error(error.message));
    })
  );
};

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);
function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (req.url.includes('logout')) {
    authService.clearSession();
    return throwError(() => new Error('به مولا بای'));
  }
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res: { access_token: string }) => {
        isRefreshing = false;
        const token = res.access_token;
        refreshTokenSubject.next(token);
        localStorage.setItem('auth_token', token);
        req = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
        return next(req);
      }),
      catchError((error) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.logout();
        return throwError(() => new Error(error.message));
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((token) => {
        if (token) {
          req = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
          return next(req);
        } else {
          isRefreshing = false;
          authService.logout();
          return throwError(() => new Error('به مولا بای'));
        }
      })
    );
  }
}
