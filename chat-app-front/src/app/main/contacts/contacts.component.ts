import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, Subject, take } from 'rxjs';
import { MainService } from '../main.service';
import { MatIconModule } from '@angular/material/icon';

interface ContactUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  status?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule],
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

  constructor(public mainService: MainService, private dialogRef: MatDialogRef<ContactsComponent>) {
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
          status: c.status,
          isOnline: c.isOnline,
          lastSeen: c.lastSeen,
        }));
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

  isContact(userId: string): boolean {
    return this.contacts.some((c) => c._id === userId);
  }
}
