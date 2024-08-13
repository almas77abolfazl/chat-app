import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent {
  verificationCode: string = '';
  phoneNumber: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.phoneNumber = this.route.snapshot.queryParamMap.get('phone');
  }

  verifyCode() {
    // اینجا باید کدی نوشته بشه که کد تایید رو به سرور بفرسته و صحت اون رو بررسی کنه
    this.router.navigate(['/chat']);
  }
}
