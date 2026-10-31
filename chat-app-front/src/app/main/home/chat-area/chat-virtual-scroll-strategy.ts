import {
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  OnDestroy,
  Output,
  AfterViewInit,
} from '@angular/core';
import { CdkVirtualScrollViewport, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { Observable, Subject } from 'rxjs';
import { Message } from '../../../models/message.model';

@Injectable()
export class DynamicChatVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly _scrolledIndexChange = new Subject<number>();
  readonly scrolledIndexChange: Observable<number> = this._scrolledIndexChange.asObservable();

  private viewport: CdkVirtualScrollViewport | null = null;
  private messages: Message[] = [];
  private itemHeights: number[] = [];
  private offsets: number[] = [];
  private totalContentSize: number = 0;

  private minBufferPx = 400;
  private maxBufferPx = 800;

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.recalculate();
    this.updateRenderedRange();
  }

  detach(): void {
    this.viewport = null;
    this._scrolledIndexChange.complete();
  }

  onContentScrolled(): void {
    this.updateRenderedRange();
  }

  onDataLengthChanged(): void {
    this.recalculate();
    this.updateRenderedRange();
  }

  onContentRendered(): void {}

  onRenderedOffsetChanged(): void {}

  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto', align: 'start' | 'center' = 'center'): void {
    if (!this.viewport || index < 0) return;
    let offset = this.getOffsetForIndex(index);
    if (align === 'center') {
      const vpSize = this.viewport.getViewportSize() || 600;
      const itemH = this.getItemHeight(index);
      offset = Math.max(0, offset - (vpSize - itemH) / 2);
    }
    this.viewport.scrollToOffset(offset, behavior);
  }

  setMessages(messages: Message[]): { prependedHeight: number; isPrepend: boolean } {
    const prevCount = this.messages.length;
    const newMessages = messages || [];
    let isPrepend = false;
    let prependedHeight = 0;

    const countDiff = newMessages.length - prevCount;

    if (
      countDiff > 0 &&
      prevCount > 0 &&
      (newMessages[countDiff]?._id === this.messages[0]?._id ||
        newMessages[newMessages.length - 1]?._id === this.messages[prevCount - 1]?._id)
    ) {
      // Older messages were prepended
      isPrepend = true;
      const newHeights: number[] = [];
      this.messages = newMessages;
      for (let i = 0; i < countDiff; i++) {
        const h = this.estimateHeight(newMessages[i], i);
        newHeights.push(h);
        prependedHeight += h;
      }
      this.itemHeights = [...newHeights, ...this.itemHeights];
    } else if (
      countDiff > 0 &&
      prevCount > 0 &&
      newMessages[0]?._id === this.messages[0]?._id
    ) {
      // New incoming messages were appended
      this.messages = newMessages;
      for (let i = prevCount; i < newMessages.length; i++) {
        this.itemHeights.push(this.estimateHeight(newMessages[i], i));
      }
    } else {
      // Full reset or chat changed
      this.messages = newMessages;
      this.itemHeights = this.messages.map((m, i) => this.estimateHeight(m, i));
    }

    this.computeOffsets();

    if (this.viewport) {
      const currentScroll = this.viewport.measureScrollOffset('top');
      this.viewport.setTotalContentSize(this.totalContentSize);
      if (isPrepend && prependedHeight > 0) {
        this.viewport.scrollToOffset(currentScroll + prependedHeight, 'auto');
      }
      this.updateRenderedRange();
    }

    return { prependedHeight, isPrepend };
  }

  updateMeasuredHeight(index: number, measuredHeight: number): void {
    if (index < 0 || index >= this.itemHeights.length || measuredHeight <= 0) return;
    const diff = measuredHeight - this.itemHeights[index];
    if (Math.abs(diff) < 3) return; // ignore subpixel and minor noise

    this.itemHeights[index] = measuredHeight;
    this.computeOffsets();

    if (this.viewport) {
      this.viewport.setTotalContentSize(this.totalContentSize);
      const currentScroll = this.viewport.measureScrollOffset('top');
      if (this.offsets[index] < currentScroll) {
        this.viewport.scrollToOffset(currentScroll + diff, 'auto');
      }
      this.updateRenderedRange();
    }
  }

  getOffsetForIndex(index: number): number {
    if (index <= 0) return 0;
    if (index >= this.offsets.length) return this.totalContentSize;
    return this.offsets[index] || 0;
  }

  getTotalContentSize(): number {
    return this.totalContentSize;
  }

  getItemHeight(index: number): number {
    return this.itemHeights[index] || 60;
  }

  private recalculate(): void {
    if (this.itemHeights.length !== this.messages.length) {
      this.itemHeights = this.messages.map((m, i) => this.estimateHeight(m, i));
    }
    this.computeOffsets();
    if (this.viewport) {
      this.viewport.setTotalContentSize(this.totalContentSize);
    }
  }

  private computeOffsets(): void {
    const count = this.itemHeights.length;
    this.offsets = new Array(count);
    let acc = 0;
    for (let i = 0; i < count; i++) {
      this.offsets[i] = acc;
      acc += this.itemHeights[i];
    }
    this.totalContentSize = acc;
  }

  updateRenderedRange(): void {
    if (!this.viewport) return;

    const dataLength = this.itemHeights.length;
    if (dataLength === 0) {
      this.viewport.setTotalContentSize(0);
      this.viewport.setRenderedRange({ start: 0, end: 0 });
      this.viewport.setRenderedContentOffset(0);
      return;
    }

    const scrollOffset = this.viewport.measureScrollOffset('top');
    const viewportSize = this.viewport.getViewportSize() || 600;

    const rangeStartOffset = Math.max(0, scrollOffset - this.minBufferPx);
    const rangeEndOffset = scrollOffset + viewportSize + this.maxBufferPx;

    const start = this.findFirstIndexAfter(rangeStartOffset);
    let end = this.findFirstIndexAfter(rangeEndOffset);
    if (end < dataLength) end++;
    end = Math.min(dataLength, Math.max(start + 1, end));

    const renderedOffset = this.offsets[start] || 0;

    this.viewport.setTotalContentSize(this.totalContentSize);
    this.viewport.setRenderedRange({ start, end });
    this.viewport.setRenderedContentOffset(renderedOffset);

    const firstVisibleIndex = this.findFirstIndexAfter(scrollOffset);
    this._scrolledIndexChange.next(firstVisibleIndex);
  }

  private findFirstIndexAfter(targetOffset: number): number {
    if (targetOffset <= 0) return 0;
    let low = 0;
    let high = this.offsets.length - 1;
    let ans = high;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const itemEnd = (this.offsets[mid] || 0) + (this.itemHeights[mid] || 0);
      if (itemEnd >= targetOffset) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return Math.max(0, Math.min(ans, this.offsets.length - 1));
  }

  private estimateHeight(message: any, index: number): number {
    if (!message) return 56;

    let h = 56;
    if (message.isDeleted) {
      h = 40;
    } else if (message.mediaType === 'system') {
      h = 44;
    } else if (message.mediaType === 'image' || message.mediaType === 'video') {
      h = 280;
    } else if (message.mediaType === 'voice') {
      h = 76;
    } else if (message.mediaType === 'audio') {
      h = 96;
    } else if (message.mediaType === 'file') {
      h = 88;
    } else if (message.mediaType === 'sticker') {
      h = 180;
    } else {
      const len = message.content?.length || 0;
      if (len > 300) h = 180;
      else if (len > 150) h = 120;
      else if (len > 60) h = 80;
      else h = 56;
    }

    if (this.hasDateSeparator(index)) h += 48;
    if (!message.isDeleted) {
      if (message.replyTo || message.replyToMessage) h += 44;
      if (message.forwardFrom) h += 30;
      if (message.reactions && message.reactions.length > 0) h += 28;
      if (message.toolCalls && message.toolCalls.length > 0) h += 34;
    }

    return h;
  }

  private hasDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const curr = this.messages[index];
    const prev = this.messages[index - 1];
    if (!curr || !prev) return false;
    const d1 = new Date(curr.createdAt || Date.now());
    const d2 = new Date(prev.createdAt || Date.now());
    return (
      d1.getFullYear() !== d2.getFullYear() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getDate() !== d2.getDate()
    );
  }
}

@Directive({
  selector: '[appMeasureHeight]',
  standalone: true,
})
export class MeasureHeightDirective implements AfterViewInit, OnDestroy {
  @Input('appMeasureHeight') index!: number;
  @Output() heightMeasured = new EventEmitter<number>();

  private resizeObserver?: ResizeObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const h = Math.round(
          this.el.nativeElement.getBoundingClientRect().height || this.el.nativeElement.offsetHeight
        );
        if (h > 0) {
          this.heightMeasured.emit(h);
        }
      });
      this.resizeObserver.observe(this.el.nativeElement);
    } else {
      const h = Math.round(
        this.el.nativeElement.getBoundingClientRect().height || this.el.nativeElement.offsetHeight
      );
      if (h > 0) {
        this.heightMeasured.emit(h);
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
