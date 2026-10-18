import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { interval, Subscription } from 'rxjs';
import { SnackbarService } from '../../helpers/snackbar/snackbar.service';

@Component({
    selector: 'app-verify-code',
    imports: [RouterModule, FormsModule, FontAwesomeModule, MatSnackBarModule],
    templateUrl: './verify-code.component.html',
    styleUrl: './verify-code.component.scss'
})
export class VerifyCodeComponent implements OnInit {
  verificationCode: string = '';
  phoneNumber = '';
  resendSeconds = 0;
  canResend = true;
  private timerSubscription: Subscription;

  constructor(public authService: AuthService, private snackbar: SnackbarService) {
    if (authService.getUserId()) authService.gotoHome();
    if (!authService.getPhoneNumber()) authService.gotoLogin();
    else this.phoneNumber = authService.getPhoneNumber();
  }

  ngOnInit() {
    // Start resend timer automatically when component loads
    this.startResendTimer();
  }

  verifyCode() {
    this.authService.verifyCode(this.verificationCode, this.phoneNumber);
  }

  startResendTimer() {
    this.canResend = false;
    this.resendSeconds = 60;
    this.timerSubscription = interval(1000).subscribe(() => {
      this.resendSeconds--;
      if (this.resendSeconds <= 0) {
        this.canResend = true;
        this.timerSubscription?.unsubscribe();
      }
    });
  }

  resendCode() {
    if (!this.canResend) return;
    this.authService.sendCode(this.phoneNumber);
    this.startResendTimer();
    this.snackbar.success('کد تایید دوباره ارسال شد', 3000);
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
  }
}
