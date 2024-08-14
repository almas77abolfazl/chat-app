import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, take } from 'rxjs';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { HttpRequestService } from '../helpers/http-request.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginUrl = 'auth/login';
  private readonly logoutUrl = 'auth/logout';
  private readonly refreshTokenUrl = 'auth/refreshToken';

  constructor(
    private httpRequestService: HttpRequestService,
    private router: Router
  ) {}

  public login(email: string, password: string): Observable<boolean> {
    return this.httpRequestService
      .post(this.loginUrl, { email, password })
      .pipe(
        take(1),
        map((response: { access_token: string; userId: string }) => {
          localStorage.setItem('auth_token', response.access_token);
          localStorage.setItem('user-id', response.userId);
          return true;
        }),
        catchError((error) => {
          console.error('Login error', error);
          return of(false);
        })
      );
  }

  sendCode(phoneNumber: string) {
    this.httpRequestService
      .post('auth/send-code', {
        phoneNumber,
      })
      .subscribe({
        next: (response) => {
          console.log('Verification code:', response.code);
          this.router.navigate(['/verify-code'], {
            queryParams: { phoneNumber },
          });
        },
        error: (error) => {
          console.error('Error sending code:', error.error.message);
        },
      });
  }

  verifyCode(code: string) {
    this.httpRequestService.post('auth/verify-code', { code }).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Verification successful');

          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Invalid verification code');
      },
    });
  }

  public refreshToken(): Observable<any> {
    const headers = { _id: this.getUserId() };
    return this.httpRequestService.post(this.refreshTokenUrl, {}, headers);
  }

  public logout(): void {
    const headers = { _id: this.getUserId() };
    this.router.navigate(['/login']);
    this.httpRequestService
      .post(this.logoutUrl, {}, headers)
      .pipe(take(1))
      .subscribe((x: any) => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user-id');
      });
  }

  public getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  public getUserId(): string {
    return localStorage.getItem('user-id') || '';
  }
}
