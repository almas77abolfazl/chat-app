import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StoryGroup, StoryItem } from '../../models/story.model';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { take } from 'rxjs';
import { getTelegramGradient, getInitials } from '../../helpers/avatar.helper';
import { DatePipe } from '@angular/common';

export interface StoryViewerDialogData {
  group: StoryGroup;
  currentUserId: string;
}

@Component({
  selector: 'app-story-viewer-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe, DatePipe],
  templateUrl: './story-viewer-dialog.component.html',
  styleUrl: './story-viewer-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryViewerDialogComponent implements OnInit, OnDestroy {
  readonly currentIndexSignal = signal<number>(0);
  get currentIndex(): number { return this.currentIndexSignal(); }
  set currentIndex(v: number) { this.currentIndexSignal.set(v); }

  readonly progressSignal = signal<number>(0);
  get progress(): number { return this.progressSignal(); }
  set progress(v: number) { this.progressSignal.set(v); }

  readonly showViewers = signal<boolean>(false);
  readonly viewersList = signal<any[]>([]);
  readonly loadingViewers = signal<boolean>(false);

  private timerInterval: any;
  private isPaused = false;
  private isHolding = false;
  private pressStartTime = 0;
  private touchStartY = 0;
  private touchStartX = 0;
  private readonly STORY_DURATION = 5000; // 5s per story
  private readonly TICK_MS = 50;

  constructor(
    public dialogRef: MatDialogRef<StoryViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoryViewerDialogData,
    public mainService: MainService,
    public translationService: TranslationService,
  ) {}

  ngOnInit() {
    this.startStory();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  get currentStory(): StoryItem | undefined {
    return this.data.group.stories[this.currentIndex];
  }

  get authorBg(): string {
    return getTelegramGradient(this.data.group.user._id || this.authorName);
  }

  get authorName(): string {
    const u = this.data.group.user;
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'کاربر';
  }

  startStory() {
    this.progress = 0;
    this.clearTimer();
    const story = this.currentStory;
    if (story) {
      this.mainService.viewStory(story._id).pipe(take(1)).subscribe();
      story.isViewed = true;
      this.data.group.hasUnseen = this.data.group.stories.some((s) => !s.isViewed);
    }

    this.timerInterval = setInterval(() => {
      if (!this.isPaused && !this.isHolding && !this.showViewers()) {
        this.progress += (this.TICK_MS / this.STORY_DURATION) * 100;
        if (this.progress >= 100) {
          this.next();
        }
      }
    }, this.TICK_MS);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.showViewers() && !this.isHolding) {
      this.isPaused = false;
    }
  }

  onPointerDown(e: MouseEvent | TouchEvent) {
    this.pressStartTime = Date.now();
    this.isHolding = true;
    if ('touches' in e && e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartX = e.touches[0].clientX;
    } else if ('clientY' in e) {
      this.touchStartY = e.clientY;
      this.touchStartX = e.clientX;
    }
    this.pause();
  }

  onPointerUp(e: MouseEvent | TouchEvent, side?: 'prev' | 'next') {
    const holdDuration = Date.now() - this.pressStartTime;
    this.isHolding = false;

    let endY = this.touchStartY;
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      endY = e.changedTouches[0].clientY;
    } else if ('clientY' in e) {
      endY = e.clientY;
    }

    const deltaY = this.touchStartY - endY;

    // Swipe up detected -> open viewers if current user story
    if (deltaY > 50 && this.data.group.isCurrentUser) {
      this.openViewers();
      return;
    }

    if (this.showViewers()) {
      return;
    }

    this.resume();

    // If hold was longer than 250ms, it was a hold-to-pause; do not navigate
    if (holdDuration > 250) {
      return;
    }

    // Normal tap navigation
    if (side === 'prev') {
      this.prev();
    } else if (side === 'next') {
      this.next();
    }
  }

  toggleViewers() {
    if (this.showViewers()) {
      this.closeViewers();
    } else {
      this.openViewers();
    }
  }

  openViewers() {
    const story = this.currentStory;
    if (!story) return;
    this.showViewers.set(true);
    this.pause();
    this.loadingViewers.set(true);
    this.mainService
      .getStoryViewers(story._id)
      .pipe(take(1))
      .subscribe({
        next: (viewers) => {
          this.viewersList.set(viewers || []);
          this.loadingViewers.set(false);
        },
        error: () => {
          this.viewersList.set([]);
          this.loadingViewers.set(false);
        },
      });
  }

  closeViewers() {
    this.showViewers.set(false);
    this.resume();
  }

  getViewerBg(user: any): string {
    return getTelegramGradient(user?._id || user?.firstName || 'viewer');
  }

  getViewerInitial(user: any): string {
    return getInitials(user?.firstName, user?.lastName, '؟');
  }

  getViewerName(user: any): string {
    if (!user) return 'کاربر';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.username || 'کاربر';
  }

  openViewerProfile(viewer: any) {
    const userId = viewer?.user?._id || viewer?.user;
    if (!userId) return;
    this.close();
    this.mainService.openUserProfileModal(userId);
  }

  openAuthorProfile() {
    const authorId = this.data.group.user?._id;
    if (!authorId) return;
    this.close();
    this.mainService.openUserProfileModal(authorId);
  }

  next() {
    if (this.currentIndex < this.data.group.stories.length - 1) {
      this.currentIndex++;
      this.startStory();
    } else {
      this.close();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.startStory();
    } else {
      this.progress = 0;
    }
  }

  deleteCurrentStory() {
    const story = this.currentStory;
    if (!story) return;
    if (confirm(this.translationService.t('story.confirmDelete'))) {
      this.mainService.deleteStory(story._id).subscribe({
        next: () => {
          this.data.group.stories.splice(this.currentIndex, 1);
          if (this.data.group.stories.length === 0) {
            this.close();
          } else {
            if (this.currentIndex >= this.data.group.stories.length) {
              this.currentIndex = this.data.group.stories.length - 1;
            }
            this.startStory();
          }
        },
      });
    }
  }

  close() {
    this.clearTimer();
    this.dialogRef.close();
  }
}
