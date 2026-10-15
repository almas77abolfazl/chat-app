import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-contacts',
  imports: [FontAwesomeModule],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent {
  contacts = [
    { name: 'ممد', status: '۱ دقیقه پیش' },
    { name: 'احمد', status: '۱ دقیقه پیش' },
    { name: 'مرتضی', status: '۳ دقیقه پیش' },
    { name: 'زی زی', status: '۵ دقیقه پیش' },
    { name: 'تی تی', status: '۱۰ دقیقه پیش' },
  ];

  constructor(private dialog: MatDialog) {}
}
