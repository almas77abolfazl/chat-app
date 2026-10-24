import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StoryGroup, StoryItem } from '../../models/story.model';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';
import { take } from 'rxjs';

export interface StoryViewerDialogData {
  group: StoryGroup;
  currentUserId: string;
}

@Component({
  selector: 'app-story-viewer-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
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

  private timerInterval: any;
  private isPaused = false;
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
    }

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
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
    this.isPaused = false;
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
    if (confirm('آیا از حذف این استوری مطمئن هستید؟')) {
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
