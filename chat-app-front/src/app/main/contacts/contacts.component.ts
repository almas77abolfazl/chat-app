import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, Subject, take } from 'rxjs';
import { MainService } from '../main.service';
import { MatIconModule } from '@angular/material/icon';
import { I18nPipe } from '../../helpers/i18n.pipe';

interface ContactUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  avatar?: string;
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
})
export class ContactsComponent implements OnInit {
  query = '';
  private searchSubject = new Subject<string>();
  results: ContactUser[] = [];
  contacts: ContactUser[] = [];
  loading = false;
  currentUserId: string;
  showNewContactForm = false;
  newContactFirstName = '';
  newContactLastName = '';
  newContactPhone = '';

  constructor(
    public mainService: MainService,
    private dialogRef: MatDialogRef<ContactsComponent>
  ) {
    this.currentUserId = this.mainService.authService.getUserId();
  }

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe((q) => this.doSearch(q));
    this.loadContacts();
  }

  loadContacts() {
    this.mainService.getContacts().pipe(take(1)).subscribe({
      next: (res: any[]) => {
        this.contacts = (res || []).map((c) => ({
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          phoneNumber: c.phoneNumber,
          profilePicture: c.profilePicture,
          avatar: null,
          status: c.status,
          isOnline: c.isOnline,
          lastSeen: c.lastSeen,
        }));
        this.contacts.forEach(async (contact) => {
          await this.resolveContactAvatar(contact);
        });
      },
      error: () => {
        this.contacts = [];
      },
    });
  }

  onSearch(query: string) {
    this.searchSubject.next(query);
  }

  doSearch(query: string) {
    if (!query.trim()) {
      this.results = [];
      return;
    }
    this.loading = true;
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe({
        next: (res: any[]) => {
          this.results = (res || []).filter((r) => r._id !== this.currentUserId && !this.contacts.some((c) => c._id === r._id));
          this.loading = false;
        },
        error: () => {
          this.results = [];
          this.loading = false;
        },
      });
  }

  addContact(user: ContactUser) {
    this.mainService.addContact(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.contacts.push(user);
        this.resolveContactAvatar(user);
        this.results = this.results.filter((r) => r._id !== user._id);
      },
      error: () => {},
    });
  }

  removeContact(user: ContactUser) {
    this.mainService.removeContact(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.contacts = this.contacts.filter((c) => c._id !== user._id);
      },
      error: () => {},
    });
  }

  pick(user: ContactUser) {
    this.dialogRef.close({ startChat: user });
  }

  private async resolveContactAvatar(contact: ContactUser): Promise<void> {
    if (contact.avatar) return;
    const avatar = await this.mainService.getAvatar(contact._id);
    if (avatar) contact.avatar = avatar;
  }

  getAvatarUrl(contact: ContactUser): string | null {
    return contact.profilePicture || contact.avatar || null;
  }

  isContact(userId: string): boolean {
    return this.contacts.some((c) => c._id === userId);
  }

  addNewContact() {
    if (!this.newContactPhone.trim()) return;
    const newContact: ContactUser = {
      _id: 'new-' + Date.now(),
      firstName: this.newContactFirstName.trim() || undefined,
      lastName: this.newContactLastName.trim() || undefined,
      phoneNumber: this.newContactPhone.trim(),
    };
    this.addContact(newContact);
    this.showNewContactForm = false;
    this.newContactFirstName = '';
    this.newContactLastName = '';
    this.newContactPhone = '';
  }

  cancelNewContact() {
    this.showNewContactForm = false;
    this.newContactFirstName = '';
    this.newContactLastName = '';
    this.newContactPhone = '';
  }
}
