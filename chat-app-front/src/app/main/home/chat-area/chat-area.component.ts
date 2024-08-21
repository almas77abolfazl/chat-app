import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent {
  constructor(public mainService: MainService) {}
}
