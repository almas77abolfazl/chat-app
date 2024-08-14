import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent {
  verificationCode: string = '';
  phoneNumber: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.phoneNumber = this.route.snapshot.queryParamMap.get('phone');
  }

  verifyCode() {
    this.http
      .post<{ success: boolean }>('/api/auth/verify-code', {
        code: this.verificationCode,
      })
      .subscribe({
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
}
