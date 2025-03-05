import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
@Component({
  selector: 'app-side-bar',
  imports: [FontAwesomeModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  standalone: true,
})
export class SideBarComponent {
  customItems: { icon: string; title: string; id: string }[] = [];
  constructor(public mainService: MainService) {}
}
