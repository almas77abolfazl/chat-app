import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [FontAwesomeModule, NgFor],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  customItems: { icon: string; title: string; id: string }[] = [];
  constructor(public mainService: MainService) {}
}
