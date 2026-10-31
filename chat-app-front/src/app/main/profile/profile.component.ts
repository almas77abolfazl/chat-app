import { Component, Inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ChatListItem } from '../../models/chat-list-item.model';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { AdminManagementDialogComponent } from '../admin-management-dialog/admin-management-dialog.component';
import { MainService } from '../main.service';
import { TranslationService } from '../../helpers/translation.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { take } from 'rxjs';

export interface ProfileDialogData {
  targetUserId?: string;
  chat?: ChatListItem;
  _id?: string;
  isGroup?: boolean;
  isChannel?: boolean;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatars?: string[];
  participants?: any[];
  ownerId?: string;
  peerId?: string;
  otherParticipant?: any;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  readonly chatDataSignal = signal<ChatListItem | null>(null);
  get chatData(): ChatListItem | null { return this.chatDataSignal(); }
  set chatData(v: ChatListItem | null) { this.chatDataSignal.set(v); }

  readonly targetUserIdSignal = signal<string | null>(null);
  get targetUserId(): string | null { return this.targetUserIdSignal(); }
  set targetUserId(v: string | null) { this.targetUserIdSignal.set(v); }

  readonly userProfileSignal = signal<any>(null);
  get userProfile(): any { return this.userProfileSignal(); }
  set userProfile(v: any) { this.userProfileSignal.set(v); }

  readonly loadingProfileSignal = signal<boolean>(true);
  get loadingProfile(): boolean { return this.loadingProfileSignal(); }
  set loadingProfile(v: boolean) { this.loadingProfileSignal.set(v); }

  // Avatars carousel
  readonly avatarsSignal = signal<string[]>([]);
  get avatars(): string[] { return this.avatarsSignal(); }
  set avatars(v: string[]) { this.avatarsSignal.set(v); }

  readonly activeAvatarIndexSignal = signal<number>(0);
  get activeAvatarIndex(): number { return this.activeAvatarIndexSignal(); }
  set activeAvatarIndex(v: number) { this.activeAvatarIndexSignal.set(v); }

  readonly showFullscreenAvatarSignal = signal<boolean>(false);
  get showFullscreenAvatar(): boolean { return this.showFullscreenAvatarSignal(); }
  set showFullscreenAvatar(v: boolean) { this.showFullscreenAvatarSignal.set(v); }

  readonly avatarLoadErrorSignal = signal<boolean>(false);
  get avatarLoadError(): boolean { return this.avatarLoadErrorSignal(); }
  set avatarLoadError(v: boolean) { this.avatarLoadErrorSignal.set(v); }

  // Media tabs
  readonly activeMediaTabSignal = signal<'photos' | 'files' | 'voice'>('photos');
  get activeMediaTab(): 'photos' | 'files' | 'voice' { return this.activeMediaTabSignal(); }
  set activeMediaTab(v: 'photos' | 'files' | 'voice') { this.activeMediaTabSignal.set(v); }

  readonly mediaSummarySignal = signal({
    photosCount: 0,
    videosCount: 0,
    filesCount: 0,
    voiceCount: 0,
  });
  get mediaSummary() { return this.mediaSummarySignal(); }
  set mediaSummary(v: { photosCount: number; videosCount: number; filesCount: number; voiceCount: number }) { this.mediaSummarySignal.set(v); }

  readonly mediaItemsSignal = signal<any[]>([]);
  get mediaItems(): any[] { return this.mediaItemsSignal(); }
  set mediaItems(v: any[]) { this.mediaItemsSignal.set(v); }

  readonly loadingMediaSignal = signal<boolean>(false);
  get loadingMedia(): boolean { return this.loadingMediaSignal(); }
  set loadingMedia(v: boolean) { this.loadingMediaSignal.set(v); }

  readonly copiedUsernameSignal = signal<boolean>(false);
  get copiedUsername(): boolean { return this.copiedUsernameSignal(); }
  set copiedUsername(v: boolean) { this.copiedUsernameSignal.set(v); }

  readonly isTargetUserBlockedSignal = signal<boolean>(false);
  get isTargetUserBlocked(): boolean { return this.isTargetUserBlockedSignal(); }
  set isTargetUserBlocked(v: boolean) { this.isTargetUserBlockedSignal.set(v); }

  readonly isContactSignal = signal<boolean>(false);
  get isContact(): boolean { return this.isContactSignal(); }
  set isContact(v: boolean) { this.isContactSignal.set(v); }

  constructor(
    public dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    public mainService: MainService,
    public translationService: TranslationService,
    @Inject(MAT_DIALOG_DATA)
    public data: ProfileDialogData
  ) {}

  ngOnInit(): void {
    this.initData();
  }

  private initData(): void {
    const d = this.data || {};
    const myId = this.mainService.authService.getUserId();

    if (d.chat) {
      this.chatData = d.chat;
    } else if (d._id && (d.isGroup || d.isChannel || d.participants)) {
      this.chatData = d as unknown as ChatListItem;
    }

    if (d.targetUserId) {
      this.targetUserId = d.targetUserId;
    } else if (this.chatData && !this.chatData.isGroup && !this.chatData.isChannel) {
      this.targetUserId = this.chatData.peerId || this.chatData.otherParticipant?._id || myId;
    } else if (!this.chatData) {
      this.targetUserId = myId;
    }

    if (this.isGroup || this.isChannel) {
      this.setupGroupOrChannel();
    } else if (this.targetUserId) {
      this.loadUserProfile(this.targetUserId);
      if (!this.isCurrentUser) {
        this.checkBlockedStatus();
      }
    } else {
      this.loadingProfile = false;
    }

    // Load media summary if a chatId exists
    const chatId = this.chatData?._id;
    if (chatId) {
      this.loadMediaSummary(chatId);
      this.loadMediaItems(chatId, this.activeMediaTab);
    }
  }

  get isGroup(): boolean {
    return !!this.chatData?.isGroup;
  }

  get isChannel(): boolean {
    return !!this.chatData?.isChannel;
  }

  get isCurrentUser(): boolean {
    const myId = this.mainService.authService.getUserId();
    return !this.isGroup && !this.isChannel && this.targetUserId === myId;
  }

  get displayName(): string {
    if (this.isGroup || this.isChannel) {
      return this.chatData?.name || '';
    }
    if (this.userProfile) {
      const f = this.userProfile.firstName || '';
      const l = this.userProfile.lastName || '';
      const full = `${f} ${l}`.trim();
      return full || this.userProfile.username || this.translationService.t('profile.unknownUser');
    }
    if (this.chatData) {
      const f = this.chatData.firstName || '';
      const l = this.chatData.lastName || '';
      const full = `${f} ${l}`.trim();
      return full || this.translationService.t('profile.unknownUser');
    }
    return this.translationService.t('profile.unknownUser');
  }

  get username(): string | null {
    return this.userProfile?.username || null;
  }

  get bio(): string | null {
    return this.userProfile?.bio || null;
  }

  get phoneNumber(): string | null {
    return this.userProfile?.phoneNumber || null;
  }

  get isOnline(): boolean {
    return !!this.userProfile?.isOnline;
  }

  get lastSeen(): Date | null {
    return this.userProfile?.lastSeen || null;
  }

  get privacyStatus(): string | null {
    return this.userProfile?.privacyStatus || null;
  }

  get statusText(): string {
    if (this.isOnline) return this.translationService.t('status.online');
    if (this.privacyStatus === 'a_long_time_ago') return this.translationService.t('chat.lastSeenALongTimeAgo');
    if (this.privacyStatus === 'recently') return this.translationService.t('chat.lastSeenRecently');
    if (this.lastSeen) return this.formatProfileLastSeen(this.lastSeen);
    return this.translationService.t('status.offline');
  }

  formatProfileLastSeen(lastSeenDate: Date | string): string {
    const date = new Date(lastSeenDate);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 60000) {
      return this.translationService.t('chat.lastSeenRecently');
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    if (date.toDateString() === now.toDateString()) {
      return this.translationService.t('chat.lastSeenToday', { time: timeStr });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return this.translationService.t('chat.lastSeenYesterday', { time: timeStr });
    }
    return this.translationService.t('profile.lastSeen', { time: `${date.toLocaleDateString()} ${timeStr}` });
  }

  get coverColor(): string {
    if (this.isChannel) return 'linear-gradient(135deg, #4f46e5, #7c3aed)';
    if (this.isGroup) return 'linear-gradient(135deg, #7c3aed, #db2777)';
    return 'linear-gradient(135deg, #2563eb, #7c3aed)';
  }

  get activeAvatarUrl(): string | null {
    if (this.avatarLoadError || this.avatars.length === 0) return null;
    return this.mainService.getAvatarUrl(this.avatars[this.activeAvatarIndex]);
  }

  get initials(): string {
    const name = this.displayName.trim();
    if (!name) return '?';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  get totalMediaCount(): number {
    return (
      (this.mediaSummary.photosCount || 0) +
      (this.mediaSummary.videosCount || 0) +
      (this.mediaSummary.filesCount || 0) +
      (this.mediaSummary.voiceCount || 0)
    );
  }

  private setupGroupOrChannel(): void {
    this.loadingProfile = false;
    const rawAvatars: string[] = [];
    if (this.chatData?.avatars && Array.isArray(this.chatData.avatars)) {
      rawAvatars.push(...this.chatData.avatars);
    }
    if (this.chatData?.avatar && !rawAvatars.includes(this.chatData.avatar)) {
      rawAvatars.unshift(this.chatData.avatar);
    }
    this.avatars = Array.from(new Set(rawAvatars)).filter(Boolean);
    this.activeAvatarIndex = 0;
  }

  private loadUserProfile(userId: string): void {
    this.loadingProfile = true;
    this.mainService
      .getUserProfile(userId)
      .pipe(take(1))
      .subscribe({
        next: (profile: any) => {
          this.userProfile = profile;
          this.isContact = !!profile.isContact;
          this.loadingProfile = false;
          const rawAvatars: string[] = [];
          if (profile.avatars && Array.isArray(profile.avatars)) {
            rawAvatars.push(...profile.avatars);
          }
          if (profile.profilePicture && !rawAvatars.includes(profile.profilePicture)) {
            rawAvatars.unshift(profile.profilePicture);
          }
          this.avatars = Array.from(new Set(rawAvatars)).filter(Boolean);
          this.activeAvatarIndex = 0;
          this.avatarLoadError = false;
        },
        error: () => {
          this.loadingProfile = false;
        },
      });
  }

  private loadMediaSummary(chatId: string): void {
    this.mainService
      .getChatMediaSummary(chatId)
      .pipe(take(1))
      .subscribe({
        next: (summary: any) => {
          this.mediaSummary = summary;
        },
        error: () => {},
      });
  }

  private loadMediaItems(chatId: string, type: 'photos' | 'files' | 'voice'): void {
    this.loadingMedia = true;
    this.mainService
      .getChatMedia(chatId, type, 1, 30)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          this.mediaItems = res?.items || [];
          this.loadingMedia = false;
        },
        error: () => {
          this.mediaItems = [];
          this.loadingMedia = false;
        },
      });
  }

  switchMediaTab(tab: 'photos' | 'files' | 'voice'): void {
    this.activeMediaTab = tab;
    const chatId = this.chatData?._id;
    if (chatId) {
      this.loadMediaItems(chatId, tab);
    }
  }

  nextAvatar(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.avatars.length <= 1) return;
    this.avatarLoadError = false;
    this.activeAvatarIndex = (this.activeAvatarIndex + 1) % this.avatars.length;
  }

  prevAvatar(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.avatars.length <= 1) return;
    this.avatarLoadError = false;
    this.activeAvatarIndex = (this.activeAvatarIndex - 1 + this.avatars.length) % this.avatars.length;
  }

  setAvatarIndex(idx: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.avatarLoadError = false;
    this.activeAvatarIndex = idx;
  }

  openFullscreenAvatar(): void {
    if (this.activeAvatarUrl) {
      this.showFullscreenAvatar = true;
    }
  }

  closeFullscreenAvatar(event?: Event): void {
    if (event) event.stopPropagation();
    this.showFullscreenAvatar = false;
  }

  onAvatarError(): void {
    this.avatarLoadError = true;
  }

  deleteCurrentAvatar(event: Event): void {
    event.stopPropagation();
    if (!this.isCurrentUser || this.avatars.length === 0) return;
    const filename = this.avatars[this.activeAvatarIndex];
    if (!filename) return;

    this.mainService
      .deleteAvatar(filename)
      .pipe(take(1))
      .subscribe({
        next: (updatedList: string[]) => {
          this.avatars = updatedList || [];
          this.activeAvatarIndex = Math.max(0, Math.min(this.activeAvatarIndex, this.avatars.length - 1));
          this.mainService.pictureSrc = this.activeAvatarUrl || '';
          this.mainService.snackbar.success(this.translationService.t('profile.avatarDeleted'), 3000);
        },
        error: () => {
          this.mainService.snackbar.error('profile.avatarDeleteError', 3000);
        },
      });
  }

  copyUsername(): void {
    if (!this.username) return;
    navigator.clipboard?.writeText(`@${this.username}`);
    this.copiedUsername = true;
    this.mainService.snackbar.success(this.translationService.t('profile.copied'), 2000);
    setTimeout(() => {
      this.copiedUsername = false;
    }, 2000);
  }

  sendMessage(): void {
    this.dialogRef.close();
    if (this.chatData && (this.chatData.chatId || this.chatData._id)) {
      this.mainService.openChat(this.chatData);
      return;
    }
    if (this.targetUserId) {
      this.mainService
        .startDirectChat({ _id: this.targetUserId, firstName: this.displayName })
        .then((chat) => {
          this.mainService.openChat(chat);
        });
    }
  }

  editProfile(): void {
    this.dialogRef.close();
    this.dialog.open(EditProfileComponent, {
      width: '440px',
      maxWidth: '96vw',
      panelClass: 'rtl-dialog',
      data: {
        firstName: this.userProfile?.firstName || this.mainService.authService.getFirstName() || '',
        lastName: this.userProfile?.lastName || this.mainService.authService.getLastName() || '',
        bio: this.userProfile?.bio || localStorage.getItem('user-bio') || '',
        pictureSrc: this.activeAvatarUrl || this.mainService.pictureSrc || '',
      },
    });
  }

  viewMemberProfile(member: any): void {
    const memberId = member._id || member.id;
    if (!memberId) return;
    this.dialogRef.close();
    this.mainService.openUserProfileModal(memberId);
  }

  memberInitials(p: any): string {
    const f = (p?.firstName || '').trim();
    const l = (p?.lastName || '').trim();
    if (f && l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
    if (f) return f.charAt(0).toUpperCase();
    if (l) return l.charAt(0).toUpperCase();
    return '?';
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  openMediaFile(item: any): void {
    if (!item?.fileUrl) return;
    const url = this.mainService.getAvatarUrl(item.fileUrl) || item.fileUrl;
    window.open(url, '_blank');
  }

  checkBlockedStatus(): void {
    if (!this.targetUserId || this.isCurrentUser) return;
    this.mainService
      .isUserBlocked(this.targetUserId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.isTargetUserBlocked = !!res?.isBlocked;
        },
        error: () => {},
      });
  }

  toggleBlockUser(): void {
    if (!this.targetUserId || this.isCurrentUser) return;
    if (!this.isTargetUserBlocked) {
      if (confirm(this.translationService.t('block.confirmBlock'))) {
        this.mainService
          .blockUser(this.targetUserId)
          .pipe(take(1))
          .subscribe({
            next: () => {
              this.isTargetUserBlocked = true;
              this.mainService.snackbar.success(this.translationService.t('block.userBlockedBanner'), 3000);
            },
            error: () => {
              this.mainService.snackbar.error('block.blockError', 3000);
            },
          });
      }
    } else {
      this.mainService
        .unblockUser(this.targetUserId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isTargetUserBlocked = false;
            this.mainService.snackbar.success(this.translationService.t('block.unblockUser'), 3000);
          },
          error: () => {
            this.mainService.snackbar.error('block.unblockError', 3000);
          },
        });
    }
  }

  toggleContact(): void {
    if (!this.targetUserId || this.isCurrentUser) return;
    if (this.isContact) {
      this.mainService
        .removeContact(this.targetUserId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isContact = false;
            this.mainService.snackbar.success(this.translationService.t('contacts.removeFromContacts'), 3000);
            this.mainService.getContacts().pipe(take(1)).subscribe();
          },
          error: () => {
            this.mainService.snackbar.error('contacts.removeError', 3000);
          },
        });
    } else {
      this.mainService
        .addContact(this.targetUserId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isContact = true;
            this.mainService.snackbar.success(this.translationService.t('contacts.addToContacts'), 3000);
            this.mainService.getContacts().pipe(take(1)).subscribe();
          },
          error: () => {
            this.mainService.snackbar.error('contacts.addError', 3000);
          },
        });
    }
  }

  openAdminManagement(member: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!this.chatData?._id) return;

    const memberId = (member._id || member).toString();
    const existingAdmin = (this.chatData.admins || []).find((a: any) => a.userId === memberId);

    const dialogRef = this.dialog.open(AdminManagementDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      panelClass: 'rtl-dialog',
      data: {
        chatId: this.chatData._id,
        member,
        isChannel: this.isChannel,
        existingPermissions: existingAdmin?.permissions,
        customTitle: existingAdmin?.customTitle,
        isOwner: this.isChatOwner(this.currentUserId),
        isCurrentAdmin: !!existingAdmin,
      },
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      if (!result) return;
      if (result.action === 'save') {
        this.mainService
          .addAdmin(this.chatData!._id, result.targetUserId, result.permissions, result.customTitle)
          .pipe(take(1))
          .subscribe({
            next: (updatedChat: any) => {
              this.chatData!.admins = updatedChat.admins;
              this.mainService.snackbar.success('admin.adminSaved', 3000);
            },
            error: (err: any) => {
              this.mainService.snackbar.error(err, 3000);
            },
          });
      } else if (result.action === 'dismiss') {
        this.mainService
          .removeAdmin(this.chatData!._id, result.targetUserId)
          .pipe(take(1))
          .subscribe({
            next: (updatedChat: any) => {
              this.chatData!.admins = updatedChat.admins;
              this.mainService.snackbar.success('admin.adminDismissed', 3000);
            },
            error: (err: any) => {
              this.mainService.snackbar.error(err, 3000);
            },
          });
      }
    });
  }

  isChatOwner(userId?: string): boolean {
    if (!userId || !this.chatData) return false;
    return (this.chatData.ownerId || (this.chatData as any).owner) === userId;
  }

  isChatAdmin(userId?: string): boolean {
    if (!userId || !this.chatData?.admins) return false;
    return this.chatData.admins.some((a: any) => a.userId === userId);
  }

  getAdminTitle(userId?: string): string {
    if (!userId || !this.chatData?.admins) return '';
    const admin = this.chatData.admins.find((a: any) => a.userId === userId);
    return admin?.customTitle || 'مدیر';
  }

  canManageAdmins(): boolean {
    const myId = this.currentUserId;
    if (this.isChatOwner(myId)) return true;
    const admin = this.chatData?.admins?.find((a: any) => a.userId === myId);
    return !!admin?.permissions?.canManageAdmins;
  }

  get currentUserId(): string {
    return this.mainService.authService.getUserId();
  }
}
