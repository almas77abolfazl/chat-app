import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../helpers/snackbar/snackbar.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [RouterModule, FormsModule, FontAwesomeModule, MatSnackBarModule, I18nPipe],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyCodeComponent implements OnInit {
  readonly verificationCodeSignal = signal<string>('');
  get verificationCode(): string { return this.verificationCodeSignal(); }
  set verificationCode(v: string) { this.verificationCodeSignal.set(v); }

  phoneNumber = '';

  readonly resendSecondsSignal = signal<number>(0);
  get resendSeconds(): number { return this.resendSecondsSignal(); }
  set resendSeconds(v: number) { this.resendSecondsSignal.set(v); }

  readonly canResendSignal = signal<boolean>(true);
  get canResend(): boolean { return this.canResendSignal(); }
  set canResend(v: boolean) { this.canResendSignal.set(v); }

  private timerSubscription?: Subscription;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public authService: AuthService,
    private snackbar: SnackbarService,
    public translationService: TranslationService,
    public themeService: ThemeService
  ) {
    if (authService.getUserId()) authService.gotoHome();
    if (!authService.getPhoneNumber()) authService.gotoLogin();
    else this.phoneNumber = authService.getPhoneNumber();
  }

  ngOnInit() {
    this.startResendTimer();
  }

  verifyCode() {
    const code = this.verificationCode.trim();
    if (code.length < 6 || code.includes(' ')) return;
    this.authService.verifyCode(code, this.phoneNumber);
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    this.verificationCode = digits;

    const inputs = document.querySelectorAll<HTMLInputElement>('.otp-input');
    const targetIdx = Math.min(digits.length, 5);
    if (inputs[targetIdx]) {
      inputs[targetIdx].focus();
    }

    if (digits.length === 6) {
      this.verifyCode();
    }
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length > 1) {
      const digits = value.replace(/\D/g, '');
      if (digits.length > 1) {
        const currentArr = (this.verificationCode || '').padEnd(6, ' ').split('');
        for (let i = 0; i < digits.length && (index + i) < 6; i++) {
          currentArr[index + i] = digits[i];
        }
        this.verificationCode = currentArr.join('').trimEnd();
        const nextIdx = Math.min(index + digits.length, 5);
        const inputs = document.querySelectorAll<HTMLInputElement>('.otp-input');
        if (inputs[nextIdx]) inputs[nextIdx].focus();
        if (this.verificationCode.length === 6 && !this.verificationCode.includes(' ')) {
          this.verifyCode();
        }
        return;
      }
    }

    if (value.length === 1 && /^\d$/.test(value)) {
      const currentArr = (this.verificationCode || '').padEnd(6, ' ').split('');
      currentArr[index] = value;
      this.verificationCode = currentArr.join('').trimEnd();

      if (index < 5) {
        const nextInput = (event.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }

      if (this.verificationCode.length === 6 && !this.verificationCode.includes(' ')) {
        this.verifyCode();
      }
    } else if (value.length === 0) {
      const currentArr = (this.verificationCode || '').padEnd(6, ' ').split('');
      currentArr[index] = ' ';
      this.verificationCode = currentArr.join('').trimEnd();
    }
  }

  onOtpBackspace(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.value === '' && index > 0) {
      const prevInput = (event.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        const currentArr = (this.verificationCode || '').padEnd(6, ' ').split('');
        currentArr[index - 1] = ' ';
        this.verificationCode = currentArr.join('').trimEnd();
      }
    }
  }

  startResendTimer() {
    this.resendSeconds = 60;
    this.canResend = false;
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resendSeconds = this.resendSeconds - 1;
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
  }

  getOtpArray(): string[] {
    const arr = this.verificationCode.split('');
    while (arr.length < 6) arr.push('');
    return arr;
  }
}
