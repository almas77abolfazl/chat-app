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

  constructor(
    private httpRequestService: HttpRequestService,
    private router: Router
  ) {}

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

  verifyCode(code: string, phoneNumber: string) {
    this.httpRequestService
      .post('auth/verify-code', { code, phoneNumber })
      .subscribe({
        next: (response) => {
          localStorage.setItem('auth_token', response.access_token);
          localStorage.setItem('user-id', response.userId);
          console.log('Verification successful');
          if (response.hasName) this.router.navigate(['/home']);
          else this.router.navigate(['/fill-names']);
        },
        error: (err) => {
          console.error('Invalid verification code');
        },
      });
  }

  updateUserNames(firstName: string, lastName: string) {
    this.httpRequestService
      .post('user/updateUserNames', { firstName, lastName })
      .subscribe({
        next: (response) => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Invalid updating user names');
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
