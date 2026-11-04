import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';

export interface AddContactDialogData {
  userId: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  phoneNumber?: string;
  username?: string;
}

export interface AddContactDialogResult {
  confirmed: boolean;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './add-contact-dialog.component.html',
  styleUrl: './add-contact-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddContactDialogComponent {
  readonly firstNameSignal = signal<string>('');
  readonly lastNameSignal = signal<string>('');

  get firstName(): string {
    return this.firstNameSignal();
  }
  set firstName(v: string) {
    this.firstNameSignal.set(v);
  }

  get lastName(): string {
    return this.lastNameSignal();
  }
  set lastName(v: string) {
    this.lastNameSignal.set(v);
  }

  constructor(
    public dialogRef: MatDialogRef<AddContactDialogComponent, AddContactDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: AddContactDialogData,
    public translationService: TranslationService,
  ) {
    this.firstNameSignal.set(data?.defaultFirstName || '');
    this.lastNameSignal.set(data?.defaultLastName || '');
  }

  onSave(): void {
    this.dialogRef.close({
      confirmed: true,
      firstName: this.firstNameSignal().trim(),
      lastName: this.lastNameSignal().trim(),
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      confirmed: false,
      firstName: '',
      lastName: '',
    });
  }
}

