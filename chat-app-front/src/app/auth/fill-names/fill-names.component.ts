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

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.firstName && !this.lastName) {
      this.errorMessage = 'Please enter at least your first name or last name.';
    } else {
      this.authService.updateUserNames(this.firstName, this.lastName);
    }
  }
}
