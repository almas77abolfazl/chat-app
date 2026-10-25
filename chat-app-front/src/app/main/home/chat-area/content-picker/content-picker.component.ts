import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../../../helpers/i18n.pipe';
import { EMOJI_CATEGORIES, EmojiCategory } from './emojis.data';
import { STICKERS, STICKER_PACKS, StickerItem, StickerPack } from './stickers.data';
import { GIFS, GIF_CATEGORIES, GifItem } from './gifs.data';

export type PickerTab = 'emoji' | 'stickers' | 'gifs';

@Component({
  selector: 'app-content-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './content-picker.component.html',
  styleUrl: './content-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPickerComponent {
  readonly emojiSelect = output<string>();
  readonly stickerSelect = output<{ url: string; name: string }>();
  readonly gifSelect = output<{ url: string; caption?: string }>();
  readonly gifFileSelect = output<File>();
  readonly close = output<void>();

  readonly activeTab = signal<PickerTab>('emoji');
  readonly searchQuery = signal<string>('');

  // Emoji data
  readonly emojiCategories: EmojiCategory[] = EMOJI_CATEGORIES;
  readonly selectedEmojiCategory = signal<string>('smileys');

  // Sticker data
  readonly stickerPacks: StickerPack[] = STICKER_PACKS;
  readonly selectedStickerPack = signal<string>('all');
  readonly stickers: StickerItem[] = STICKERS;

  // GIF data
  readonly gifCategories = GIF_CATEGORIES;
  readonly selectedGifCategory = signal<string>('all');
  readonly gifs: GifItem[] = GIFS;

  setTab(tab: PickerTab): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  // --- Emojis ---
  readonly filteredEmojiCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const selCat = this.selectedEmojiCategory();
    if (!q) {
      if (selCat === 'all') return this.emojiCategories;
      return this.emojiCategories.filter((c) => c.id === selCat);
    }
    return this.emojiCategories
      .map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(q) || cat.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.emojis.length > 0);
  });

  selectEmoji(emoji: string, event: Event): void {
    event.stopPropagation();
    this.emojiSelect.emit(emoji);
  }

  // --- Stickers ---
  readonly filteredStickers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const selPack = this.selectedStickerPack();
    let list = this.stickers;
    if (selPack !== 'all') {
      list = list.filter((s) => s.pack === selPack);
    }
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  });

  selectSticker(sticker: StickerItem, event: Event): void {
    event.stopPropagation();
    this.stickerSelect.emit({ url: sticker.url, name: sticker.name });
  }

  // --- GIFs ---
  readonly filteredGifs = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const selCat = this.selectedGifCategory();
    let list = this.gifs;
    if (selCat !== 'all') {
      list = list.filter((g) => g.category === selCat);
    }
    if (q) {
      list = list.filter(
        (g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  });

  selectGif(gif: GifItem, event: Event): void {
    event.stopPropagation();
    this.gifSelect.emit({ url: gif.url, caption: gif.title });
  }

  onCustomGifUpload(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.gifFileSelect.emit(file);
    }
  }
}
