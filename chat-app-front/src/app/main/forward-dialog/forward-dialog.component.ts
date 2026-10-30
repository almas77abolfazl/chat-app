import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../main.service';
import { ChatListItem } from '../../models/chat-list-item.model';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { getTelegramGradient } from '../../helpers/avatar.helper';

export interface ForwardDialogData {
  messageIds: string[];
  messageCount: number;
}

@Component({
  selector: 'app-forward-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  template: `
    <div class="forward-dialog-container">
      <div class="forward-header">
        <div class="header-title">
          <fa-icon [icon]="['fas', 'share']" class="share-icon"></fa-icon>
          <h3>{{ 'chat.forwardTo' | i18n }}</h3>
        </div>
        <button type="button" class="close-btn" (click)="dialogRef.close()">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
      </div>

      <div class="forward-search-box">
        <fa-icon [icon]="['fas', 'search']" class="search-icon"></fa-icon>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          [placeholder]="'contacts.search' | i18n"
          class="forward-search-input"
        />
        @if (searchQuery) {
        <button type="button" class="clear-search-btn" (click)="searchQuery = ''">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
        }
      </div>

      <div class="forward-chat-list">
        @for (chat of filteredChats(); track chat._id) {
        <div class="forward-chat-item" (click)="selectTargetChat(chat)">
          <div class="chat-avatar" [style.background]="getChatGradient(chat)">
            @if (chat.avatar) {
            <img [src]="mainService.getAvatarUrl(chat.avatar)" alt="Avatar" class="avatar-img" />
            } @else {
            <span class="avatar-letter">{{ getChatInitial(chat) }}</span>
            }
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ getChatTitle(chat) }}</div>
            <div class="chat-subtitle">
              @if (chat.isSavedMessages) {
              {{ 'chat.cloudStorage' | i18n }}
              } @else if (chat.isGroup) {
              {{ 'folders.groups' | i18n }}
              } @else if (chat.isChannel) {
              {{ 'folders.channels' | i18n }}
              } @else {
              {{ 'chat.title' | i18n }}
              }
            </div>
          </div>
          <fa-icon [icon]="['fas', 'arrow-left']" class="forward-arrow"></fa-icon>
        </div>
        }
        @if (filteredChats().length === 0) {
        <div class="empty-results">
          <fa-icon [icon]="['fas', 'search']"></fa-icon>
          <p>{{ 'contacts.noResults' | i18n }}</p>
        </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .forward-dialog-container {
      direction: rtl;
      display: flex;
      flex-direction: column;
      max-height: 82vh;
      background: var(--color-surface-solid);
      color: var(--color-text);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .forward-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .share-icon {
          color: var(--color-primary);
          font-size: 1.15rem;
        }

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }
      }

      .close-btn {
        width: 2rem;
        height: 2rem;
        border-radius: var(--radius-full);
        border: none;
        background: transparent;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background var(--transition-fast);

        &:hover {
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-text);
        }
      }
    }

    .forward-search-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0.85rem 1.25rem 0.5rem;
      padding: 0.55rem 0.9rem;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);

      .search-icon {
        color: var(--color-text-faint);
        font-size: 0.85rem;
      }

      .forward-search-input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--color-text);
        outline: none;
        font-family: inherit;
        font-size: 0.9rem;
      }

      .clear-search-btn {
        border: none;
        background: transparent;
        color: var(--color-text-faint);
        cursor: pointer;
        padding: 0;
      }
    }

    .forward-chat-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-height: 240px;
      max-height: 55vh;
    }

    .forward-chat-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);

        .forward-arrow {
          transform: translateX(-3px);
          color: var(--color-primary);
        }
      }

      .chat-avatar {
        width: 2.85rem;
        height: 2.85rem;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: 1.15rem;
        overflow: hidden;
        flex-shrink: 0;

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .chat-info {
        flex: 1;
        min-width: 0;

        .chat-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-subtitle {
          font-size: 0.78rem;
          color: var(--color-text-secondary);
          margin-top: 0.15rem;
        }
      }

      .forward-arrow {
        color: var(--color-text-faint);
        font-size: 0.85rem;
        transition: transform var(--transition-fast), color var(--transition-fast);
      }
    }

    .empty-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--color-text-faint);
      gap: 0.6rem;

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForwardDialogComponent {
  searchQuery = '';

  constructor(
    public dialogRef: MatDialogRef<ForwardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ForwardDialogData,
    public mainService: MainService,
  ) {}

  filteredChats(): ChatListItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const chats = this.mainService.chatItems || [];
    if (!q) return chats;
    return chats.filter((c) => {
      const name = this.getChatTitle(c).toLowerCase();
      return name.includes(q);
    });
  }

  getChatTitle(chat: ChatListItem): string {
    if (chat.isSavedMessages) return 'پیام‌های ذخیره‌شده';
    if (chat.name) return chat.name;
    const f = chat.firstName || '';
    const l = chat.lastName || '';
    return `${f} ${l}`.trim() || 'کاربر';
  }

  getChatInitial(chat: ChatListItem): string {
    const title = this.getChatTitle(chat);
    return title.charAt(0) || '؟';
  }

  getChatGradient(chat: ChatListItem): string {
    return getTelegramGradient(chat._id || chat.name || 'chat');
  }

  selectTargetChat(chat: ChatListItem) {
    this.dialogRef.close({ targetChat: chat });
  }
}

