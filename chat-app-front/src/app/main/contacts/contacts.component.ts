import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, Subject, take } from 'rxjs';
import { MainService } from '../main.service';

interface ContactUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent implements OnInit {
  query = '';
  private searchSubject = new Subject<string>();
  results: ContactUser[] = [];
  loading = false;
  currentUserId: string;

  constructor(public mainService: MainService, private dialogRef: MatDialogRef<ContactsComponent>) {
    this.currentUserId = this.mainService.authService.getUserId();
  }

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe((q) => this.doSearch(q));
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
          this.results = (res || []).filter((r) => r._id !== this.currentUserId);
          this.loading = false;
        },
        error: () => {
          this.results = [];
          this.loading = false;
        },
      });
  }

  pick(user: ContactUser) {
    this.dialogRef.close({ startChat: user });
  }
}
