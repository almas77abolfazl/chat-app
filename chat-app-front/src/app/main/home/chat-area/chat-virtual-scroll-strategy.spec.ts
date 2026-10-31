import { DynamicChatVirtualScrollStrategy } from './chat-virtual-scroll-strategy';
import { Message } from '../../../models/message.model';

class MockViewport {
  renderedRange = { start: 0, end: 0 };
  renderedOffset = 0;
  totalContentSize = 0;
  scrollOffset = 0;
  viewportSize = 600;

  setTotalContentSize(size: number) {
    this.totalContentSize = size;
  }
  setRenderedRange(range: { start: number; end: number }) {
    this.renderedRange = range;
  }
  setRenderedContentOffset(offset: number) {
    this.renderedOffset = offset;
  }
  measureScrollOffset(_direction: 'top' = 'top'): number {
    return this.scrollOffset;
  }
  getViewportSize(): number {
    return this.viewportSize;
  }
  scrollToOffset(offset: number) {
    this.scrollOffset = offset;
  }
}

describe('DynamicChatVirtualScrollStrategy', () => {
  let strategy: DynamicChatVirtualScrollStrategy;

  beforeEach(() => {
    strategy = new DynamicChatVirtualScrollStrategy();
  });

  function createMockMessage(
    id: string,
    text: string,
    mediaType: string = 'text',
    date: string = '2026-10-31T10:00:00Z',
    isDeleted: boolean = false
  ): Message {
    return {
      _id: id,
      content: text,
      mediaType: mediaType as any,
      createdAt: new Date(date) as any,
      senderId: 'user1',
      recipientId: 'user2',
      isDeleted,
    } as any;
  }

  it('should initialize with empty messages', () => {
    strategy.setMessages([]);
    expect(strategy.getTotalContentSize()).toBe(0);
    expect(strategy.getOffsetForIndex(0)).toBe(0);
  });

  it('should calculate initial estimated heights based on message types', () => {
    const msgs: Message[] = [
      createMockMessage('m1', 'Hello world', 'text', '2026-10-31T10:00:00Z'),
      createMockMessage('m2', '', 'image', '2026-10-31T10:05:00Z'),
      createMockMessage('m3', '', 'voice', '2026-10-31T10:10:00Z'),
      createMockMessage('m4', '', 'sticker', '2026-10-31T10:15:00Z'),
    ];

    strategy.setMessages(msgs);
    expect(strategy.getTotalContentSize()).toBeGreaterThan(0);

    // First item has date separator, so its height should be base + 48
    const h1 = strategy.getItemHeight(0);
    expect(h1).toBeGreaterThanOrEqual(56 + 48);

    // Second item is image (around 280)
    const h2 = strategy.getItemHeight(1);
    expect(h2).toBe(280);

    // Third item is voice (around 76)
    const h3 = strategy.getItemHeight(2);
    expect(h3).toBe(76);

    // Fourth item is sticker (around 180)
    const h4 = strategy.getItemHeight(3);
    expect(h4).toBe(180);
  });

  it('should estimate small height for deleted messages', () => {
    const msgs: Message[] = [
      createMockMessage('m1', 'This message was deleted', 'text', '2026-10-31T10:00:00Z', true),
    ];
    strategy.setMessages(msgs);
    // Deleted message has height 40 + date separator (48) for index 0 = 88
    expect(strategy.getItemHeight(0)).toBe(88);
  });

  it('should handle prepending older messages (Infinite Scroll Upwards)', () => {
    const initialMsgs: Message[] = [
      createMockMessage('m3', 'Message 3', 'text', '2026-10-31T12:00:00Z'),
      createMockMessage('m4', 'Message 4', 'text', '2026-10-31T12:05:00Z'),
    ];
    strategy.setMessages(initialMsgs);
    const initialTotal = strategy.getTotalContentSize();

    // Prepend 2 older messages
    const prependedMsgs: Message[] = [
      createMockMessage('m1', 'Message 1', 'text', '2026-10-31T11:00:00Z'),
      createMockMessage('m2', 'Message 2', 'text', '2026-10-31T11:05:00Z'),
      createMockMessage('m3', 'Message 3', 'text', '2026-10-31T12:00:00Z'),
      createMockMessage('m4', 'Message 4', 'text', '2026-10-31T12:05:00Z'),
    ];

    const result = strategy.setMessages(prependedMsgs);
    expect(result.isPrepend).toBe(true);
    expect(result.prependedHeight).toBeGreaterThan(0);
    expect(strategy.getTotalContentSize()).toBe(initialTotal + result.prependedHeight);
  });

  it('should handle appending new messages smoothly', () => {
    const initialMsgs: Message[] = [createMockMessage('m1', 'Message 1', 'text')];
    strategy.setMessages(initialMsgs);
    const initialTotal = strategy.getTotalContentSize();

    const updatedMsgs: Message[] = [
      createMockMessage('m1', 'Message 1', 'text'),
      createMockMessage('m2', 'Message 2', 'text'),
    ];
    const result = strategy.setMessages(updatedMsgs);
    expect(result.isPrepend).toBe(false);
    expect(strategy.getTotalContentSize()).toBeGreaterThan(initialTotal);
  });

  it('should update measured height accurately', () => {
    const msgs: Message[] = [
      createMockMessage('m1', 'Message 1', 'text'),
      createMockMessage('m2', 'Message 2', 'text'),
    ];
    strategy.setMessages(msgs);

    // Suppose item 0 is measured to be 150px
    strategy.updateMeasuredHeight(0, 150);
    expect(strategy.getItemHeight(0)).toBe(150);
    expect(strategy.getOffsetForIndex(1)).toBe(150);
    expect(strategy.getTotalContentSize()).toBe(150 + strategy.getItemHeight(1));
  });

  it('should handle large mock dataset (1000 messages) with high performance', () => {
    const heavyMsgs: Message[] = [];
    for (let i = 0; i < 1000; i++) {
      const type = i % 5 === 0 ? 'image' : i % 7 === 0 ? 'voice' : 'text';
      heavyMsgs.push(createMockMessage(`m-${i}`, `Message content number ${i}`, type));
    }

    const t0 = performance.now();
    strategy.setMessages(heavyMsgs);
    const duration = performance.now() - t0;

    expect(duration).toBeLessThan(50); // Under 50ms for 1000 items
    expect(strategy.getTotalContentSize()).toBeGreaterThan(50000);
    expect(strategy.getOffsetForIndex(500)).toBeGreaterThan(strategy.getOffsetForIndex(100));
  });

  describe('with attached CdkVirtualScrollViewport', () => {
    let mockVp: MockViewport;

    beforeEach(() => {
      mockVp = new MockViewport();
      strategy.attach(mockVp as any);
    });

    it('should only render a small buffer slice out of 1000 messages at top', () => {
      const heavyMsgs: Message[] = [];
      for (let i = 0; i < 1000; i++) {
        heavyMsgs.push(createMockMessage(`m-${i}`, `Message ${i}`, 'text'));
      }
      strategy.setMessages(heavyMsgs);

      // Total content size should reflect all 1000 items
      expect(mockVp.totalContentSize).toBe(strategy.getTotalContentSize());

      // At top (offset 0), rendered range should only render ~20-30 items, NOT all 1000
      expect(mockVp.renderedRange.start).toBe(0);
      expect(mockVp.renderedRange.end).toBeLessThan(40);
      expect(mockVp.renderedRange.end).toBeGreaterThan(5);
    });

    it('should update rendered slice when user scrolls to middle of 1000 messages', () => {
      const heavyMsgs: Message[] = [];
      for (let i = 0; i < 1000; i++) {
        heavyMsgs.push(createMockMessage(`m-${i}`, `Message ${i}`, 'text'));
      }
      strategy.setMessages(heavyMsgs);

      // Scroll to offset 25,000px
      mockVp.scrollOffset = 25000;
      strategy.onContentScrolled();

      // Rendered range should shift to middle items
      expect(mockVp.renderedRange.start).toBeGreaterThan(200);
      expect(mockVp.renderedRange.end - mockVp.renderedRange.start).toBeLessThan(40);
      expect(mockVp.renderedOffset).toBeLessThanOrEqual(25000);
    });

    it('should compensate scroll position when prepending older messages during active scroll', () => {
      const initialMsgs: Message[] = [
        createMockMessage('m20', 'Message 20', 'text'),
        createMockMessage('m21', 'Message 21', 'text'),
      ];
      strategy.setMessages(initialMsgs);

      mockVp.scrollOffset = 50;

      // Prepend 5 older messages
      const prependedMsgs: Message[] = [
        createMockMessage('m15', 'Message 15', 'text'),
        createMockMessage('m16', 'Message 16', 'text'),
        createMockMessage('m17', 'Message 17', 'text'),
        createMockMessage('m18', 'Message 18', 'text'),
        createMockMessage('m19', 'Message 19', 'text'),
        createMockMessage('m20', 'Message 20', 'text'),
        createMockMessage('m21', 'Message 21', 'text'),
      ];

      const res = strategy.setMessages(prependedMsgs);
      expect(res.isPrepend).toBe(true);
      expect(res.prependedHeight).toBeGreaterThan(0);
      // Viewport scroll offset should be adjusted to keep user in exact same visual spot
      expect(mockVp.scrollOffset).toBe(50 + res.prependedHeight);
    });

    it('should adjust scroll position when an item above current scroll changes height', () => {
      const msgs: Message[] = [
        createMockMessage('m0', 'Message 0', 'text'),
        createMockMessage('m1', 'Message 1', 'text'),
        createMockMessage('m2', 'Message 2', 'text'),
        createMockMessage('m3', 'Message 3', 'text'),
      ];
      strategy.setMessages(msgs);

      // User is scrolled past item 0
      mockVp.scrollOffset = 200;

      // Item 0 gets measured with a +50px difference (e.g. image loaded)
      const prevHeight = strategy.getItemHeight(0);
      strategy.updateMeasuredHeight(0, prevHeight + 50);

      // Viewport scroll offset should shift by +50 to prevent content jumping down
      expect(mockVp.scrollOffset).toBe(200 + 50);
    });

    it('should NOT adjust scroll position when an item below current scroll changes height', () => {
      const msgs: Message[] = [
        createMockMessage('m0', 'Message 0', 'text'),
        createMockMessage('m1', 'Message 1', 'text'),
        createMockMessage('m2', 'Message 2', 'text'),
        createMockMessage('m3', 'Message 3', 'text'),
      ];
      strategy.setMessages(msgs);

      // User is near the top
      mockVp.scrollOffset = 20;

      // Item 3 (far below) changes height
      const prevHeight = strategy.getItemHeight(3);
      strategy.updateMeasuredHeight(3, prevHeight + 50);

      // Viewport scroll offset should remain unaffected
      expect(mockVp.scrollOffset).toBe(20);
    });

    it('should correctly center item when scrollToIndex is called with center alignment', () => {
      const heavyMsgs: Message[] = [];
      for (let i = 0; i < 100; i++) {
        heavyMsgs.push(createMockMessage(`m-${i}`, `Message ${i}`, 'text'));
      }
      strategy.setMessages(heavyMsgs);

      const targetIndex = 50;
      const targetOffset = strategy.getOffsetForIndex(targetIndex);
      const targetHeight = strategy.getItemHeight(targetIndex);
      const expectedCenterOffset = Math.max(0, targetOffset - (mockVp.viewportSize - targetHeight) / 2);

      strategy.scrollToIndex(targetIndex, 'smooth', 'center');
      expect(mockVp.scrollOffset).toBe(expectedCenterOffset);
    });
  });
});

