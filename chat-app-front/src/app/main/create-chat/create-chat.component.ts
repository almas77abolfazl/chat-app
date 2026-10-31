import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { take } from 'rxjs';

type Mode = 'direct' | 'group' | 'channel';

@Component({
  selector: 'app-create-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, I18nPipe],
  template: `
    <div class="create-chat-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ 'chat.newChat' | i18n }}</h2>
        <button class="dialog-close-btn" (click)="cancel()">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
      </div>

      <div class="create-chat-content">
        <div class="mode-pills">
          <button type="button" class="mode-pill" [class.active]="mode() === 'direct'" (click)="setMode('direct')">
            <fa-icon [icon]="['fas', 'user']"></fa-icon>
            <span>{{ 'profile.directChat' | i18n }}</span>
          </button>
          <button type="button" class="mode-pill" [class.active]="mode() === 'group'" (click)="setMode('group')">
            <fa-icon [icon]="['fas', 'users']"></fa-icon>
            <span>{{ 'groups.newGroup' | i18n }}</span>
          </button>
          <button type="button" class="mode-pill" [class.active]="mode() === 'channel'" (click)="setMode('channel')">
            <fa-icon [icon]="['fas', 'broadcast-tower']"></fa-icon>
            <span>{{ 'channels.newChannel' | i18n }}</span>
          </button>
        </div>

        @if (mode() === 'direct') {
          <div class="form-group">
            <label class="form-label">{{ 'contacts.search' | i18n }}</label>
            <div class="search-wrapper">
              <input
                class="custom-input with-icon"
                [placeholder]="'contacts.search' | i18n"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
                autofocus
              />
              <fa-icon [icon]="['fas', 'search']" class="search-icon"></fa-icon>
            </div>
          </div>

          <div class="users-list">
            @for (r of results(); track r._id) {
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
            @if (results().length === 0 && searchQuery()) {
              <div class="empty-results">{{ 'contacts.noResults' | i18n }}</div>
            } @else if (results().length === 0 && !searchQuery()) {
              <div class="empty-results">{{ 'chat.selectOrStart' | i18n }}</div>
            }
          </div>
        }

        @if (mode() === 'group') {
          <div class="form-group">
            <label class="form-label">{{ 'groups.groupName' | i18n }}</label>
            <input
              class="custom-input"
              [placeholder]="'groups.groupNamePlaceholder' | i18n"
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
            />
          </div>

          @if (members().length > 0) {
            <div class="selected-chips">
              @for (m of members(); track m._id) {
                <div class="chip">
                  <span>{{ m.firstName }} {{ m.lastName || '' }}</span>
                  <fa-icon [icon]="['fas', 'times']" class="chip-remove" (click)="remove(m)"></fa-icon>
                </div>
              }
            </div>
          }

          <div class="form-group">
            <label class="form-label">{{ 'groups.addMembers' | i18n }}</label>
            <div class="search-wrapper">
              <input
                class="custom-input with-icon"
                [placeholder]="'groups.searchMembers' | i18n"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
              />
              <fa-icon [icon]="['fas', 'search']" class="search-icon"></fa-icon>
            </div>
          </div>

          <div class="users-list">
            @for (r of results(); track r._id) {
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

        @if (mode() === 'channel') {
          <div class="form-group">
            <label class="form-label">{{ 'channels.channelName' | i18n }}</label>
            <input
              class="custom-input"
              [placeholder]="'channels.channelNamePlaceholder' | i18n"
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
            />
          </div>
        }
      </div>

      @if (mode() !== 'direct') {
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">{{ 'common.cancel' | i18n }}</button>
          <button type="button" class="btn btn-primary" [disabled]="!canCreate()" (click)="create()">
            {{ mode() === 'group' ? ('groups.createGroup' | i18n) : ('channels.createChannel' | i18n) }}
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './create-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChatComponent {
  readonly mode = signal<Mode>('direct');
  readonly name = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly results = signal<any[]>([]);
  readonly members = signal<any[]>([]);

  readonly canCreate = computed(() => {
    const m = this.mode();
    const n = this.name().trim();
    if (m === 'channel') return !!n;
    if (m === 'group') return !!n && this.members().length > 0;
    return true;
  });

  constructor(
    private dialogRef: MatDialogRef<CreateChatComponent>,
    private mainService: MainService
  ) {}

  setMode(m: Mode) {
    this.mode.set(m);
    this.searchQuery.set('');
    this.results.set([]);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.results.set([]);
      return;
    }
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe({
        next: (users) => {
          this.results.set(users || []);
        },
        error: () => {
          this.results.set([]);
        },
      });
  }

  add(user: any) {
    const current = this.members();
    if (!current.some((m) => m._id === user._id)) {
      this.members.set([...current, user]);
    }
  }

  remove(user: any) {
    this.members.set(this.members().filter((m) => m._id !== user._id));
  }

  async startDirectWith(user: any) {
    try {
      const item = await this.mainService.startDirectChat(user);
      this.mainService.openChat(item);
      this.close();
    } catch {
      this.mainService.snackbar.error('chat.startChatError', 3000);
    }
  }

  async create() {
    try {
      let item: any;
      const m = this.mode();
      const n = this.name().trim();
      if (m === 'group') {
        item = await this.mainService.createGroup(n, this.members().map((mem) => mem._id));
      } else if (m === 'channel') {
        item = await this.mainService.createChannel(n);
      }
      if (item) {
        this.mainService.openChat(item);
      }
      this.close();
    } catch {
      this.mainService.snackbar.error('chat.createChatError', 3000);
    }
  }

  cancel() {
    this.close();
  }

  private close() {
    this.dialogRef.close();
  }
}
