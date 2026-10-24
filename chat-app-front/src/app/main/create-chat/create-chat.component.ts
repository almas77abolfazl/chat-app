import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../main.service';
import { take } from 'rxjs';

type Mode = 'direct' | 'group' | 'channel';

@Component({
  selector: 'app-create-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="create-chat-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">گفتگوی جدید</h2>
        <button class="dialog-close-btn" (click)="cancel()">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
      </div>

      <div class="create-chat-content">
        <div class="mode-pills">
          <button type="button" class="mode-pill" [class.active]="mode === 'direct'" (click)="setMode('direct')">
            <fa-icon [icon]="['fas', 'user']"></fa-icon>
            <span>چت خصوصی</span>
          </button>
          <button type="button" class="mode-pill" [class.active]="mode === 'group'" (click)="setMode('group')">
            <fa-icon [icon]="['fas', 'users']"></fa-icon>
            <span>گروه جدید</span>
          </button>
          <button type="button" class="mode-pill" [class.active]="mode === 'channel'" (click)="setMode('channel')">
            <fa-icon [icon]="['fas', 'broadcast-tower']"></fa-icon>
            <span>کانال جدید</span>
          </button>
        </div>

        @if (mode === 'direct') {
          <div class="form-group">
            <label class="form-label">جستجوی مخاطب یا کاربر</label>
            <div class="search-wrapper">
              <input
                class="custom-input with-icon"
                placeholder="نام یا نام کاربری را جستجو کنید..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch($event)"
                autofocus
              />
              <fa-icon [icon]="['fas', 'search']" class="search-icon"></fa-icon>
            </div>
          </div>

          <div class="users-list">
            @for (r of results; track r._id) {
              <div class="user-row" (click)="startDirectWith(r)">
                <div class="user-avatar">
                  @if (r.profilePicture) {
                    <img [src]="r.profilePicture" [alt]="r.firstName" />
                  } @else {
                    <span>{{ (r.firstName?.[0] || 'U').toUpperCase() }}</span>
                  }
                </div>
                <div class="user-info">
                  <span class="user-name">{{ r.firstName }} {{ r.lastName || '' }}</span>
                  @if (r.username) {
                    <span class="user-username">@{{ r.username }}</span>
                  }
                </div>
                <fa-icon [icon]="['fas', 'comment-dots']" class="action-icon"></fa-icon>
              </div>
            }
            @if (results.length === 0 && searchQuery) {
              <div class="empty-results">کاربری با این مشخصات یافت نشد</div>
            } @else if (results.length === 0 && !searchQuery) {
              <div class="empty-results">برای شروع گفتگو، نام یا نام کاربری فرد را تایپ کنید</div>
            }
          </div>
        }

        @if (mode === 'group') {
          <div class="form-group">
            <label class="form-label">نام گروه</label>
            <input class="custom-input" placeholder="نام گروه را وارد کنید..." [(ngModel)]="name" />
          </div>

          @if (members.length > 0) {
            <div class="selected-chips">
              @for (m of members; track m._id) {
                <div class="chip">
                  <span>{{ m.firstName }} {{ m.lastName || '' }}</span>
                  <fa-icon [icon]="['fas', 'times']" class="chip-remove" (click)="remove(m)"></fa-icon>
                </div>
              }
            </div>
          }

          <div class="form-group">
            <label class="form-label">افزودن اعضا</label>
            <div class="search-wrapper">
              <input
                class="custom-input with-icon"
                placeholder="جستجوی افراد برای افزودن به گروه..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch($event)"
              />
              <fa-icon [icon]="['fas', 'search']" class="search-icon"></fa-icon>
            </div>
          </div>

          <div class="users-list">
            @for (r of results; track r._id) {
              <div class="user-row" (click)="add(r)">
                <div class="user-avatar">
                  @if (r.profilePicture) {
                    <img [src]="r.profilePicture" [alt]="r.firstName" />
                  } @else {
                    <span>{{ (r.firstName?.[0] || 'U').toUpperCase() }}</span>
                  }
                </div>
                <div class="user-info">
                  <span class="user-name">{{ r.firstName }} {{ r.lastName || '' }}</span>
                  @if (r.username) {
                    <span class="user-username">@{{ r.username }}</span>
                  }
                </div>
                <fa-icon [icon]="['fas', 'plus']" class="action-icon"></fa-icon>
              </div>
            }
          </div>
        }

        @if (mode === 'channel') {
          <div class="form-group">
            <label class="form-label">نام کانال</label>
            <input class="custom-input" placeholder="نام کانال را وارد کنید..." [(ngModel)]="name" />
          </div>
        }
      </div>

      @if (mode !== 'direct') {
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">لغو</button>
          <button type="button" class="btn btn-primary" [disabled]="!canCreate()" (click)="create()">
            {{ mode === 'group' ? 'ساخت گروه' : 'ساخت کانال' }}
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './create-chat.component.scss',
})
export class CreateChatComponent {
  mode: Mode = 'direct';
  name = '';
  searchQuery = '';
  results: any[] = [];
  members: any[] = [];

  constructor(private dialogRef: MatDialogRef<CreateChatComponent>, private mainService: MainService) {}

  setMode(m: Mode) {
    this.mode = m;
    this.searchQuery = '';
    this.results = [];
  }

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
          const myId = this.mainService.authService.getUserId();
          this.results = (res || []).filter((r) => r._id !== myId);
        },
        error: () => (this.results = []),
      });
  }

  add(m: any) {
    if (!this.members.some((x) => x._id === m._id)) this.members.push(m);
    this.results = this.results.filter((x) => x._id !== m._id);
    this.searchQuery = '';
  }

  remove(m: any) {
    this.members = this.members.filter((x) => x._id !== m._id);
  }

  async startDirectWith(user: any) {
    try {
      const item = await this.mainService.startDirectChat(user);
      this.mainService.openChat(item);
      this.close();
    } catch {
      this.mainService.snackbar.error('خطا در شروع گفتگو', 3000);
    }
  }

  canCreate(): boolean {
    if (this.mode === 'channel') return !!this.name.trim();
    if (this.mode === 'group') return !!this.name.trim() && this.members.length > 0;
    return true;
  }

  async create() {
    try {
      let item: any;
      if (this.mode === 'group') {
        item = await this.mainService.createGroup(this.name.trim(), this.members.map((m) => m._id));
      } else if (this.mode === 'channel') {
        item = await this.mainService.createChannel(this.name.trim());
      }
      if (item) {
        this.mainService.openChat(item);
      }
      this.close();
    } catch {
      this.mainService.snackbar.error('خطا در ایجاد گفتگو', 3000);
    }
  }

  cancel() {
    this.close();
  }

  private close() {
    this.dialogRef.close();
  }
}
