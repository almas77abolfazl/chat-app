import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

export interface ContactUser {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent implements OnInit {
  readonly query = signal<string>('');
  readonly results = signal<ContactUser[]>([]);
  readonly contacts = signal<ContactUser[]>([]);
  readonly loading = signal<boolean>(false);
  readonly showNewContactForm = signal<boolean>(false);
  readonly newContactFirstName = signal<string>('');
  readonly newContactLastName = signal<string>('');
  readonly newContactPhone = signal<string>('');

  currentUserId: string;
  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public mainService: MainService,
    private dialogRef: MatDialogRef<ContactsComponent>
  ) {
    this.currentUserId = this.mainService.authService.getUserId();
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.doSearch(q));
    this.loadContacts();
  }

  loadContacts() {
    this.mainService.getContacts().pipe(take(1)).subscribe({
      next: (res: any[]) => {
        const mapped: ContactUser[] = (res || []).map((c) => ({
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
        this.contacts.set(mapped);
        mapped.forEach(async (contact) => {
          await this.resolveContactAvatar(contact);
        });
      },
      error: () => {
        this.contacts.set([]);
      },
    });
  }

  onSearch(query: string) {
    this.query.set(query);
    this.searchSubject.next(query);
  }

  doSearch(query: string) {
    if (!query.trim()) {
      this.results.set([]);
      return;
    }
    this.loading.set(true);
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe({
        next: (res: any[]) => {
          const currentContacts = this.contacts();
          this.results.set(
            (res || []).filter(
              (r) => r._id !== this.currentUserId && !currentContacts.some((c) => c._id === r._id)
            )
          );
          this.loading.set(false);
        },
        error: () => {
          this.results.set([]);
          this.loading.set(false);
        },
      });
  }

  addContact(user: ContactUser) {
    this.mainService.addContact(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.contacts.update((list) => [...list, user]);
        this.resolveContactAvatar(user);
        this.results.update((list) => list.filter((r) => r._id !== user._id));
      },
      error: () => {},
    });
  }

  removeContact(user: ContactUser) {
    this.mainService.removeContact(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.contacts.update((list) => list.filter((c) => c._id !== user._id));
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
    if (avatar) {
      contact.avatar = avatar;
      this.contacts.update((list) => [...list]);
    }
  }

  getAvatarUrl(contact: ContactUser): string | null {
    return contact.profilePicture || contact.avatar || null;
  }

  isContact(userId: string): boolean {
    return this.contacts().some((c) => c._id === userId);
  }

  addNewContact() {
    const phone = this.newContactPhone().trim();
    if (!phone) return;
    const newContact: ContactUser = {
      _id: 'new-' + Date.now(),
      firstName: this.newContactFirstName().trim() || undefined,
      lastName: this.newContactLastName().trim() || undefined,
      phoneNumber: phone,
    };
    this.addContact(newContact);
    this.showNewContactForm.set(false);
    this.newContactFirstName.set('');
    this.newContactLastName.set('');
    this.newContactPhone.set('');
  }

  cancelNewContact() {
    this.showNewContactForm.set(false);
    this.newContactFirstName.set('');
    this.newContactLastName.set('');
    this.newContactPhone.set('');
  }
}
