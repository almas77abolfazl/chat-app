import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { HttpRequestService } from '../helpers/http-request.service';
import { CacheService } from '../helpers/cache.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private httpRequestService: HttpRequestService, private router: Router, private cacheService: CacheService) {}

  sendCode(phoneNumber: string) {
    this.httpRequestService
      .post('auth/send-code', {
        phoneNumber,
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('Verification code:', response.code);
          localStorage.setItem('phoneNumber', phoneNumber);
          this.router.navigate(['/verify-code'], {
            queryParams: { phoneNumber },
          });
        },
        error: (error) => {
          console.error('Error sending code:', error.error.message);
        },
      });
  }

  verifyCode(code: string, phoneNumber: string) {
    this.httpRequestService.post('auth/verify-code', { code, phoneNumber }).subscribe({
      next: (response) => {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user-id', response.userId);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
        const firstName = (response.firstName || '').trim();
        const lastName = (response.lastName || '').trim();
        if (firstName || lastName) {
          localStorage.setItem('user-firstName', firstName);
          localStorage.setItem('user-lastName', lastName);
          localStorage.setItem('user-bio', response.bio || '');
          this.gotoHome();
        } else if (this.getFirstName().trim() || this.getLastName().trim()) {
          // نام قبلاً در localStorage ذخیره شده است
          this.gotoHome();
        } else {
          this.router.navigate(['/fill-names']);
        }
        console.log('Verification successful');
      },
      error: (err) => {
        console.error('Invalid verification code');
      },
    });
  }

  updateUserNames(firstName: string, lastName: string) {
    this.httpRequestService
      .post('user/updateUserNames', { firstName, lastName })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          localStorage.setItem('user-firstName', firstName);
          localStorage.setItem('user-lastName', lastName);
          this.gotoHome();
        },
        error: (err) => {
          console.error('Invalid updating user names');
        },
      });
  }

  public refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.httpRequestService.post('auth/refresh', { refreshToken });
  }

  public getRefreshToken(): string {
    return localStorage.getItem('refresh_token') || '';
  }

  public gotoHome() {
    this.router.navigate(['/home']);
  }

  public gotoLogin() {
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    const token = this.getAuthToken();
    const userId = this.getUserId();
    return !!token && !!userId;
  }

  private loggingOut = false;

  public clearSession(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.gotoLogin();
    this.cacheService.clearCache();
    localStorage.clear();
    sessionStorage.clear();
  }

  public logout(): void {
    if (this.loggingOut) return;
    const headers = { _id: this.getUserId() };
    this.httpRequestService
      .post('auth/logout', { phoneNumber: this.getPhoneNumber() }, headers)
      .pipe(take(1))
      .subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession(),
      });
  }

  public getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  public getUserId(): string {
    return localStorage.getItem('user-id') || '';
  }

  public getPhoneNumber(): string {
    return localStorage.getItem('phoneNumber') || '';
  }

  public getFirstName() {
    return localStorage.getItem('user-firstName') || '';
  }

  public getLastName() {
    return localStorage.getItem('user-lastName') || '';
  }

  public getUserNames(): string {
    const lastName = localStorage.getItem('user-lastName') || '';
    const firstName = localStorage.getItem('user-firstName') || '';
    return (firstName + lastName).trim();
  }
}
