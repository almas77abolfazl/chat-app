import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent {
  verificationCode: string = '';
  phoneNumber: string = '';

  constructor(private authService: AuthService, private route: ActivatedRoute) {
    this.phoneNumber = this.route.snapshot.queryParamMap.get('phoneNumber');
  }

  verifyCode() {
    this.authService.verifyCode(this.verificationCode, this.phoneNumber);
  }
}
