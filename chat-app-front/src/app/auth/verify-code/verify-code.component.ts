import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-verify-code',
    imports: [RouterModule, FormsModule, FontAwesomeModule],
    templateUrl: './verify-code.component.html',
    styleUrl: './verify-code.component.scss'
})
export class VerifyCodeComponent {
  verificationCode: string = '';
  phoneNumber = '';

  constructor(public authService: AuthService) {
    if (authService.getUserId()) authService.gotoHome();
    if (!authService.getPhoneNumber()) authService.gotoLogin();
    else this.phoneNumber = authService.getPhoneNumber();
  }

  verifyCode() {
    this.authService.verifyCode(this.verificationCode, this.phoneNumber);
  }
}
