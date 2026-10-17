import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../main.service';
import { take } from 'rxjs';

type Mode = 'direct' | 'group' | 'channel';

@Component({
  selector: 'app-create-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatDialogModule, FontAwesomeModule],
  template: `
    <h2 class="dialog-title" mat-dialog-title>ایجاد گفتگو</h2>
    <mat-dialog-content class="create-chat-content">
      <div class="mode-bar">
        <button mat-stroked-button [color]="mode === 'direct' ? 'primary' : undefined" (click)="mode = 'direct'">
          <fa-icon [icon]="['fas', 'user']"></fa-icon>
          <span>چت خصوصی</span>
        </button>
        <button mat-stroked-button [color]="mode === 'group' ? 'primary' : undefined" (click)="mode = 'group'">
          <fa-icon [icon]="['fas', 'users']"></fa-icon>
          <span>گروه</span>
        </button>
        <button mat-stroked-button [color]="mode === 'channel' ? 'primary' : undefined" (click)="mode = 'channel'">
          <fa-icon [icon]="['fas', 'broadcast-tower']"></fa-icon>
          <span>کانال</span>
        </button>
      </div>

      <mat-form-field class="name-field" appearance="outline">
        <mat-label>نام {{ modeLabel }}</mat-label>
        <input matInput placeholder="نام را وارد کنید" [(ngModel)]="name" />
      </mat-form-field>

      <div *ngIf="mode === 'group'" class="search-members">
        <input matInput placeholder="جستجوی افراد برای افزودن..." [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" />
        <div class="members">
          <div class="member" *ngFor="let m of members">
            <span>{{ m.firstName }} {{ m.lastName }}</span>
            <fa-icon [icon]="['fas', 'xmark']" (click)="remove(m)"></fa-icon>
          </div>
          <div class="result" *ngFor="let r of results" (click)="add(r)">
            <span>{{ r.firstName }} {{ r.lastName }}</span>
          </div>
          <div *ngIf="results.length === 0 && searchQuery" class="empty">یافت نشد</div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">لغو</button>
      <button mat-flat-button color="primary" [disabled]="!canCreate()" (click)="create()">ساخت</button>
    </mat-dialog-actions>
  `,
  styleUrl: './create-chat.component.scss',
})
export class CreateChatComponent {
  mode: Mode = 'group';
  name = '';
  searchQuery = '';
  results: any[] = [];
  members: any[] = [];

  get modeLabel(): string {
    return this.mode === 'direct' ? 'شخص' : this.mode === 'group' ? 'گروه' : 'کانال';
  }

  constructor(private dialogRef: MatDialogRef<CreateChatComponent>, private mainService: MainService) {}

  onSearch(query: string) {
    if (!query.trim()) {
      this.results = [];
      return;
    }
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe({
        next: (res: any[]) => {
          this.results = (res || []).filter((r) => r.username !== this.mainService.authService.getUserId());
        },
        error: () => (this.results = []),
      });
  }

  add(m: any) {
    if (!this.members.some((x) => x._id === m._id)) this.members.push(m);
    this.results = [];
    this.searchQuery = '';
  }

  remove(m: any) {
    this.members = this.members.filter((x) => x._id !== m._id);
  }

  canCreate(): boolean {
    if (this.mode === 'channel') return !!this.name.trim();
    if (this.mode === 'group') return !!this.name.trim() && this.members.length > 0;
    return true;
  }

  async create() {
    if (this.mode === 'group') {
      await this.mainService.createGroup(this.name, this.members.map((m) => m._id));
    } else if (this.mode === 'channel') {
      await this.mainService.createChannel(this.name);
    }
    this.close();
  }

  cancel() {
    this.close();
  }

  private close() {
    this.dialogRef.close();
  }
}
