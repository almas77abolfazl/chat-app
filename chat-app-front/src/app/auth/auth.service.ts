import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { HttpRequestService } from '../helpers/http-request.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly logoutUrl = 'auth/logout';
  private readonly refreshTokenUrl = 'auth/refreshToken';
  phoneNumber: string = localStorage.getItem('phoneNumber');

  constructor(
    private httpRequestService: HttpRequestService,
    private router: Router
  ) {}

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
    this.httpRequestService
      .post('auth/verify-code', { code, phoneNumber })
      .subscribe({
        next: (response) => {
          localStorage.setItem('auth_token', response.access_token);
          localStorage.setItem('user-id', response.userId);
          if (response.firstName && response.lastName) {
            localStorage.setItem('user-firstName', response.firstName);
            localStorage.setItem('user-lastName', response.lastName);
            localStorage.setItem('user-bio', response.bio);
            this.gotoHome();
          } else this.router.navigate(['/fill-names']);
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
          this.gotoHome();
        },
        error: (err) => {
          console.error('Invalid updating user names');
        },
      });
  }

  public gotoHome() {
    this.router.navigate(['/home']);
  }

  public gotoLogin() {
    this.router.navigate(['/login']);
  }

  public async isLoggedIn() {
    const token = this.getAuthToken();
    const userId = this.getUserId();
    if (!token || !userId) return false;
    //TODO call api
    return true;
  }

  public refreshToken(): Observable<any> {
    const headers = { _id: this.getUserId() };
    return this.httpRequestService.post(this.refreshTokenUrl, {}, headers);
  }

  public logout(): void {
    const headers = { _id: this.getUserId() };
    this.httpRequestService
      .post(this.logoutUrl, {}, headers)
      .pipe(take(1))
      .subscribe(
        (x: any) => {
          this.gotoLogin();
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user-id');
          localStorage.removeItem('phoneNumber');
          localStorage.removeItem('user-lastName');
          localStorage.removeItem('user-firsName');
          localStorage.removeItem('user-bio');
        },
        (err) => {
          this.gotoLogin();
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user-id');
          localStorage.removeItem('phoneNumber');
          localStorage.removeItem('user-lastName');
          localStorage.removeItem('user-firsName');
          localStorage.removeItem('user-bio');
        }
      );
  }

  public getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  public getUserId(): string {
    return localStorage.getItem('user-id') || '';
  }

  public getUserNames(): string {
    const lastName = localStorage.getItem('user-lastName') || '';
    const firstName = localStorage.getItem('user-firsName') || '';
    return lastName + firstName;
  }
}
