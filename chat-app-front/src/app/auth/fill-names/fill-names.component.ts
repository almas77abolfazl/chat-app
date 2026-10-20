import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
    selector: 'app-fill-names',
    imports: [FormsModule, NgIf, FontAwesomeModule, I18nPipe],
    templateUrl: './fill-names.component.html',
    styleUrl: './fill-names.component.scss'
})
export class FillNamesComponent {
  firstName: string = '';
  lastName: string = '';
  errorMessage: string = '';

  constructor(private auth: AuthService) {
    if (auth.getUserId() && auth.getUserNames()) auth.gotoHome();
    if (!auth.getPhoneNumber()) auth.gotoLogin();
  }

  onSubmit(): void {
    if (!this.firstName && !this.lastName) {
      this.errorMessage = 'لطفاً نام یا نام خانوادگی را وارد کنید.';
    } else {
      this.auth.updateUserNames(this.firstName, this.lastName);
    }
  }
}