import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly phoneNumberSignal = signal<string>('');
  get phoneNumber(): string {
    return this.phoneNumberSignal();
  }
  set phoneNumber(v: string) {
    this.phoneNumberSignal.set(v);
  }

  constructor(
    public authService: AuthService,
    public translationService: TranslationService,
    public themeService: ThemeService
  ) {
    if (authService.getUserId()) {
      authService.gotoHome();
    }
    this.phoneNumberSignal.set(authService.getPhoneNumber());
  }

  sendCode() {
    this.authService.sendCode(this.phoneNumber.trim());
  }
}
