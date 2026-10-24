import { Component, Inject, OnInit } from '@angular/core';
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
})
export class ProfileComponent implements OnInit {
  chatData: ChatListItem | null = null;
  targetUserId: string | null = null;
  userProfile: any = null;
  loadingProfile = true;

  // Avatars carousel
  avatars: string[] = [];
  activeAvatarIndex = 0;
  showFullscreenAvatar = false;
  avatarLoadError = false;

  // Media tabs
  activeMediaTab: 'photos' | 'files' | 'voice' = 'photos';
  mediaSummary = {
    photosCount: 0,
    videosCount: 0,
    filesCount: 0,
    voiceCount: 0,
  };
  mediaItems: any[] = [];
  loadingMedia = false;

  copiedUsername = false;
  isTargetUserBlocked = false;

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
          this.mainService.snackbar.error('خطا در حذف عکس', 3000);
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
              this.mainService.snackbar.error('خطا در مسدود کردن کاربر', 3000);
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
            this.mainService.snackbar.error('خطا در رفع مسدودیت کاربر', 3000);
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
              this.mainService.snackbar.success('مدیر با موفقیت ثبت شد', 3000);
            },
            error: (err: any) => {
              this.mainService.snackbar.error(err?.error?.message || 'خطا در ثبت مدیر', 3000);
            },
          });
      } else if (result.action === 'dismiss') {
        this.mainService
          .removeAdmin(this.chatData!._id, result.targetUserId)
          .pipe(take(1))
          .subscribe({
            next: (updatedChat: any) => {
              this.chatData!.admins = updatedChat.admins;
              this.mainService.snackbar.success('دسترسی مدیریت حذف شد', 3000);
            },
            error: (err: any) => {
              this.mainService.snackbar.error(err?.error?.message || 'خطا در حذف مدیر', 3000);
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
