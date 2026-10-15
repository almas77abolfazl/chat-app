import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    imports: [RouterModule, FormsModule, FontAwesomeModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  phoneNumber = '';
  constructor(public authService: AuthService) {
    if (authService.getUserId()) authService.gotoHome();
    this.phoneNumber = authService.getPhoneNumber();
  }

  sendCode() {
    this.authService.sendCode(this.phoneNumber);
  }
}
