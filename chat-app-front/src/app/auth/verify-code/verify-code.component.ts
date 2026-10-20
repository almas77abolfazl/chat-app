import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { interval, Subscription } from 'rxjs';
import { SnackbarService } from '../../helpers/snackbar/snackbar.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
    selector: 'app-verify-code',
    imports: [RouterModule, FormsModule, FontAwesomeModule, MatSnackBarModule, I18nPipe],
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
    this.startResendTimer();
  }

  verifyCode() {
    this.authService.verifyCode(this.verificationCode, this.phoneNumber);
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value.length === 1 && /^\d$/.test(value)) {
      this.verificationCode = this.verificationCode.substring(0, index) + value + this.verificationCode.substring(index + 1);
      if (index < 5) {
        const nextInput = (event.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    } else if (value.length === 0) {
      this.verificationCode = this.verificationCode.substring(0, index) + this.verificationCode.substring(index + 1);
    }
  }

  onOtpBackspace(event: Event, index: number) {
    if (index > 0) {
      const prevInput = (event.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
      this.verificationCode = this.verificationCode.substring(0, index - 1) + this.verificationCode.substring(index);
    }
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