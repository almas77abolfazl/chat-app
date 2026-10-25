import { Injectable, signal, computed } from '@angular/core';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { HttpRequestService } from '../helpers/http-request.service';
import { CacheService } from '../helpers/cache.service';

export interface AuthUserData {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<AuthUserData | null>(this.readInitialUser());
  readonly isAuthenticated = computed(() => !!this.currentUser()?.token && !!this.currentUser()?.userId);
  readonly userId = computed(() => this.currentUser()?.userId || '');
  readonly userNames = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  private loggingOut = false;

  constructor(
    private httpRequestService: HttpRequestService,
    private router: Router,
    private cacheService: CacheService
  ) {}

  private readInitialUser(): AuthUserData | null {
    if (typeof localStorage === 'undefined') return null;
    const token = localStorage.getItem('auth_token') || '';
    const userId = localStorage.getItem('user-id') || '';
    const firstName = localStorage.getItem('user-firstName') || '';
    const lastName = localStorage.getItem('user-lastName') || '';
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    if (!token && !userId) return null;
    return { token, userId, firstName, lastName, phoneNumber };
  }

  private syncUserSignal(): void {
    this.currentUser.set(this.readInitialUser());
  }

  sendCode(phoneNumber: string) {
    this.httpRequestService
      .post('auth/send-code', { phoneNumber })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          localStorage.setItem('phoneNumber', phoneNumber);
          this.syncUserSignal();
          this.router.navigate(['/verify-code'], {
            queryParams: { phoneNumber },
          });
        },
        error: (error) => {
          console.error('Error sending code:', error?.error?.message);
        },
      });
  }

  verifyCode(code: string, phoneNumber: string) {
    this.httpRequestService
      .post('auth/verify-code', { code, phoneNumber })
      .pipe(take(1))
      .subscribe({
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
            this.syncUserSignal();
            this.gotoHome();
          } else if (this.getFirstName().trim() || this.getLastName().trim()) {
            this.syncUserSignal();
            this.gotoHome();
          } else {
            this.syncUserSignal();
            this.router.navigate(['/fill-names']);
          }
        },
        error: () => {
          console.error('Invalid verification code');
        },
      });
  }

  updateUserNames(firstName: string, lastName: string) {
    this.httpRequestService
      .post('user/updateUserNames', { firstName, lastName })
      .pipe(take(1))
      .subscribe({
        next: () => {
          localStorage.setItem('user-firstName', firstName);
          localStorage.setItem('user-lastName', lastName);
          this.syncUserSignal();
          this.gotoHome();
        },
        error: () => {
          console.error('Invalid updating user names');
        },
      });
  }

  public refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.httpRequestService.post('auth/refresh', { refreshToken });
  }

  public getRefreshToken(): string {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('refresh_token') : null) || '';
  }

  public gotoHome() {
    this.router.navigate(['/home']);
  }

  public gotoLogin() {
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  public clearSession(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.currentUser.set(null);
    this.gotoLogin();
    this.cacheService.clearCache();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
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
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null) || '';
  }

  public getUserId(): string {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('user-id') : null) || '';
  }

  public getPhoneNumber(): string {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('phoneNumber') : null) || '';
  }

  public getFirstName(): string {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('user-firstName') : null) || '';
  }

  public getLastName(): string {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('user-lastName') : null) || '';
  }

  public getUserNames(): string {
    return this.userNames();
  }
}
