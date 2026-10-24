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
    const input = event.target as HTMLInputElement;
    if (input.value === '' && index > 0) {
      const prevInput = (event.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.verificationCode = this.verificationCode.substring(0, index - 1) + this.verificationCode.substring(index);
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
