import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

const COUNTRY_FLAGS: Record<string, string> = {
  '98': '🇮🇷',
  '1': '🇺🇸',
  '44': '🇬🇧',
  '49': '🇩🇪',
  '90': '🇹🇷',
  '971': '🇦🇪',
  '33': '🇫🇷',
  '7': '🇷🇺',
  '964': '🇮🇶',
  '966': '🇸🇦',
  '93': '🇦🇫',
  '39': '🇮🇹',
  '34': '🇪🇸',
  '86': '🇨🇳',
  '91': '🇮🇳',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly countryCodeSignal = signal<string>('98');
  get countryCode(): string {
    return this.countryCodeSignal();
  }
  set countryCode(v: string) {
    const cleaned = v.replace(/\D/g, '').slice(0, 4);
    this.countryCodeSignal.set(cleaned);
  }

  readonly currentCountryFlag = computed(() => {
    const code = this.countryCodeSignal();
    return COUNTRY_FLAGS[code] || '🌐';
  });

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
    const saved = authService.getPhoneNumber();
    if (saved) {
      if (saved.startsWith('+')) {
        // Parse international
        for (const code of Object.keys(COUNTRY_FLAGS)) {
          if (saved.startsWith(`+${code}`)) {
            this.countryCodeSignal.set(code);
            this.phoneNumberSignal.set(saved.slice(code.length + 1));
            return;
          }
        }
      }
      this.phoneNumberSignal.set(saved);
    }
  }

  sendCode() {
    const rawNumber = this.phoneNumber.trim();
    if (!rawNumber) return;

    const cleanCode = this.countryCodeSignal().replace(/\D/g, '') || '98';
    let fullNumber: string;

    if (cleanCode === '98') {
      if (rawNumber.startsWith('0')) {
        fullNumber = rawNumber;
      } else if (rawNumber.startsWith('9')) {
        fullNumber = '0' + rawNumber;
      } else {
        fullNumber = rawNumber;
      }
    } else {
      const cleanPhone = rawNumber.replace(/^0+/, '');
      fullNumber = `+${cleanCode}${cleanPhone}`;
    }

    this.authService.sendCode(fullNumber);
  }
}
