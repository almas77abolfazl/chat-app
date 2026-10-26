import { Component, ChangeDetectionStrategy, signal, computed, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

export interface CountryInfo {
  code: string;
  nameEn: string;
  nameFa: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: '98', nameEn: 'Iran', nameFa: 'ایران', flag: '🇮🇷' },
  { code: '1', nameEn: 'United States', nameFa: 'ایالات متحده', flag: '🇺🇸' },
  { code: '44', nameEn: 'United Kingdom', nameFa: 'بریتانیا', flag: '🇬🇧' },
  { code: '49', nameEn: 'Germany', nameFa: 'آلمان', flag: '🇩🇪' },
  { code: '90', nameEn: 'Turkey', nameFa: 'ترکیه', flag: '🇹🇷' },
  { code: '971', nameEn: 'United Arab Emirates', nameFa: 'امارات', flag: '🇦🇪' },
  { code: '33', nameEn: 'France', nameFa: 'فرانسه', flag: '🇫🇷' },
  { code: '7', nameEn: 'Russia', nameFa: 'روسیه', flag: '🇷🇺' },
  { code: '964', nameEn: 'Iraq', nameFa: 'عراق', flag: '🇮🇶' },
  { code: '93', nameEn: 'Afghanistan', nameFa: 'افغانستان', flag: '🇦🇫' },
  { code: '966', nameEn: 'Saudi Arabia', nameFa: 'عربستان', flag: '🇸🇦' },
  { code: '39', nameEn: 'Italy', nameFa: 'ایتالیا', flag: '🇮🇹' },
  { code: '34', nameEn: 'Spain', nameFa: 'اسپانیا', flag: '🇪🇸' },
  { code: '86', nameEn: 'China', nameFa: 'چین', flag: '🇨🇳' },
  { code: '91', nameEn: 'India', nameFa: 'هند', flag: '🇮🇳' },
  { code: '31', nameEn: 'Netherlands', nameFa: 'هلند', flag: '🇳🇱' },
  { code: '46', nameEn: 'Sweden', nameFa: 'سوئد', flag: '🇸🇪' },
  { code: '41', nameEn: 'Switzerland', nameFa: 'سوئیس', flag: '🇨🇭' },
  { code: '61', nameEn: 'Australia', nameFa: 'استرالیا', flag: '🇦🇺' },
  { code: '1', nameEn: 'Canada', nameFa: 'کانادا', flag: '🇨🇦' },
];

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

  readonly showCountryMenu = signal<boolean>(false);
  readonly countrySearch = signal<string>('');

  readonly currentCountry = computed<CountryInfo>(() => {
    const code = this.countryCodeSignal();
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) return found;
    return { code, nameEn: 'Other Country', nameFa: 'سایر کشورها', flag: '🌐' };
  });

  readonly filteredCountries = computed<CountryInfo[]>(() => {
    const q = this.countrySearch().trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameFa.includes(q) ||
        c.code.includes(q)
    );
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
    public themeService: ThemeService,
    private el: ElementRef,
  ) {
    if (authService.getUserId()) {
      authService.gotoHome();
    }
    const saved = authService.getPhoneNumber();
    if (saved) {
      if (saved.startsWith('+')) {
        for (const c of COUNTRIES) {
          if (saved.startsWith(`+${c.code}`)) {
            this.countryCodeSignal.set(c.code);
            this.phoneNumberSignal.set(saved.slice(c.code.length + 1));
            return;
          }
        }
      }
      this.phoneNumberSignal.set(saved);
    }
  }

  toggleCountryMenu() {
    this.showCountryMenu.update((v) => !v);
  }

  selectCountry(country: CountryInfo) {
    this.countryCodeSignal.set(country.code);
    this.showCountryMenu.set(false);
    this.countrySearch.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showCountryMenu.set(false);
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
