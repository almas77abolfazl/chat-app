import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent {
  verificationCode: string = '';

  constructor(public authService: AuthService) {
    if (authService.getUserId()) authService.gotoHome();
    if (!authService.phoneNumber) authService.gotoLogin();
  }

  verifyCode() {
    this.authService.verifyCode(
      this.verificationCode,
      this.authService.phoneNumber
    );
  }
}
