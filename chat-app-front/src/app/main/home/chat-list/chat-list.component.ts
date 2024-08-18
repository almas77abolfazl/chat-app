import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  constructor(public mainService: MainService) {}
}
