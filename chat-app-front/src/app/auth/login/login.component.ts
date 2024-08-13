import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  phoneNumber: string = '';

  constructor(private router: Router) {}

  sendCode() {
    // اینجا باید کدی نوشته بشه که شماره تلفن رو به سرور بفرسته و درخواست ارسال کد بده
    this.router.navigate(['/verify-code'], {
      queryParams: { phone: this.phoneNumber },
    });
  }
}
