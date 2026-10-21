import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { ThemeService } from '../../helpers/theme.service';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  phoneNumber = '';
  constructor(
    public authService: AuthService,
    public translationService: TranslationService,
    public themeService: ThemeService
  ) {
    if (authService.getUserId()) authService.gotoHome();
    this.phoneNumber = authService.getPhoneNumber();
  }

  sendCode() {
    this.authService.sendCode(this.phoneNumber);
  }
}
