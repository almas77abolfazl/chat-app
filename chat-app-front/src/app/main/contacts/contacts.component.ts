import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { getTelegramGradient, getInitials } from '../../helpers/avatar.helper';

export interface ContactUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  profilePicture?: string;
  avatar?: string | null;
  status?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, I18nPipe],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent implements OnInit {
  readonly query = signal<string>('');
  readonly contacts = signal<ContactUser[]>([]);
  readonly loading = signal<boolean>(false);
  readonly showNewContactForm = signal<boolean>(false);
  readonly newContactFirstName = signal<string>('');
  readonly newContactLastName = signal<string>('');
  readonly newContactPhone = signal<string>('');

  readonly filteredContacts = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.contacts();
    if (!q) return list;
    return list.filter((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const phone = c.phoneNumber || '';
      return name.includes(q) || phone.includes(q);
    });
  });

  currentUserId: string;

  constructor(
    public mainService: MainService,
    private dialogRef: MatDialogRef<ContactsComponent>
  ) {
    this.currentUserId = this.mainService.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts() {
    this.loading.set(true);
    this.mainService.getContacts().pipe(take(1)).subscribe({
      next: (res: any[]) => {
        const mapped: ContactUser[] = (res || []).map((c) => ({
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          username: c.username,
          phoneNumber: c.phoneNumber,
          profilePicture: c.profilePicture,
          avatar: null,
          status: c.status,
          isOnline: c.isOnline,
          lastSeen: c.lastSeen,
        }));
        this.contacts.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.contacts.set([]);
        this.loading.set(false);
      },
    });
  }

  onSearch(query: string) {
    this.query.set(query);
  }

  addNewContact() {
    const phone = this.newContactPhone().trim();
    if (!phone) return;
    const firstName = this.newContactFirstName().trim();
    const lastName = this.newContactLastName().trim();

    this.mainService
      .addContactByPhone(phone, firstName, lastName)
      .pipe(take(1))
      .subscribe({
        next: (newContact: any) => {
          this.contacts.update((list) => {
            const filtered = list.filter((c) => c._id !== newContact._id);
            return [...filtered, newContact];
          });
          this.mainService.snackbar.success('مخاطب با موفقیت افزوده شد', 3000);
          this.cancelNewContact();
        },
        error: (err) => {
          const msg = err?.error?.message || 'کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است';
          this.mainService.snackbar.error(Array.isArray(msg) ? msg[0] : msg, 3500);
        },
      });
  }

  cancelNewContact() {
    this.showNewContactForm.set(false);
    this.newContactFirstName.set('');
    this.newContactLastName.set('');
    this.newContactPhone.set('');
  }

  removeContact(user: ContactUser) {
    this.mainService.removeContact(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.contacts.update((list) => list.filter((c) => c._id !== user._id));
        this.mainService.snackbar.success('مخاطب حذف شد', 2500);
      },
      error: () => {
        this.mainService.snackbar.error('خطا در حذف مخاطب', 3000);
      },
    });
  }

  pick(user: ContactUser) {
    this.dialogRef.close({ startChat: user });
  }

  getAvatarUrl(contact: ContactUser): string | null {
    if (contact.profilePicture) {
      return this.mainService.getAvatarUrl(contact.profilePicture);
    }
    return null;
  }

  getContactBg(contact: ContactUser): string {
    return getTelegramGradient(contact._id || contact.firstName || contact.phoneNumber);
  }

  getContactInitial(contact: ContactUser): string {
    return getInitials(contact.firstName, contact.lastName, '؟');
  }
}
