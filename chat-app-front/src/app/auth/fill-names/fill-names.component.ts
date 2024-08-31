import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-fill-names',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './fill-names.component.html',
  styleUrl: './fill-names.component.scss',
})
export class FillNamesComponent {
  firstName: string = '';
  lastName: string = '';
  errorMessage: string = '';

  constructor(private auth: AuthService) {
    if (auth.getUserId() && auth.getUserNames()) auth.gotoHome();
    if (!auth.phoneNumber) auth.gotoLogin();
  }

  onSubmit(): void {
    if (!this.firstName && !this.lastName) {
      this.errorMessage = 'Please enter at least your first name or last name.';
    } else {
      this.auth.updateUserNames(this.firstName, this.lastName);
    }
  }
}
