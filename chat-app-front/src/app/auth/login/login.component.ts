import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  phoneNumber: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  sendCode() {
    this.http
      .post<{ code: string }>('/api/auth/send-code', {
        phoneNumber: this.phoneNumber,
      })
      .subscribe({
        next: (response) => {
          console.log('Verification code:', response.code);
          this.router.navigate(['/verify-code'], {
            queryParams: { phone: this.phoneNumber },
          });
        },
        error: (error) => {
          console.error('Error sending code:', error);
        },
      });
  }
}
