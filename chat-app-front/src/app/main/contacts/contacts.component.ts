import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [FontAwesomeModule, NgFor],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent {
  contacts = [
    { name: 'mamad', status: '1 min ago' },
    { name: 'ahamd', status: '1 min ago' },
    { name: 'morteza', status: '1 min ago' },
    { name: 'zizi', status: '1 min ago' },
    { name: 'titi', status: '1 min ago' },
  ];

  constructor(private dialog: MatDialog) {}
}
