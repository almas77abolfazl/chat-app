import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

@Component({
  selector: 'app-fill-names',
  standalone: true,
  imports: [FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './fill-names.component.html',
  styleUrl: './fill-names.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FillNamesComponent {
  readonly firstNameSignal = signal<string>('');
  get firstName(): string { return this.firstNameSignal(); }
  set firstName(v: string) { this.firstNameSignal.set(v); }

  readonly lastNameSignal = signal<string>('');
  get lastName(): string { return this.lastNameSignal(); }
  set lastName(v: string) { this.lastNameSignal.set(v); }

  readonly errorMessageSignal = signal<string>('');
  get errorMessage(): string { return this.errorMessageSignal(); }
  set errorMessage(v: string) { this.errorMessageSignal.set(v); }

  constructor(
    private auth: AuthService,
    public translationService: TranslationService,
    public themeService: ThemeService
  ) {
    if (auth.getUserId() && auth.getUserNames()) auth.gotoHome();
    if (!auth.getPhoneNumber()) auth.gotoLogin();
  }

  onSubmit(): void {
    const first = (this.firstName || '').trim();
    const last = (this.lastName || '').trim();
    if (!first && !last) {
      this.errorMessage = this.translationService.t('profile.firstNameRequired');
    } else {
      this.auth.updateUserNames(first, last);
    }
  }
}
