import { Component, EventEmitter, Output } from '@angular/core';
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
})
export class ContentPickerComponent {
  @Output() emojiSelect = new EventEmitter<string>();
  @Output() stickerSelect = new EventEmitter<{ url: string; name: string }>();
  @Output() gifSelect = new EventEmitter<{ url: string; caption?: string }>();
  @Output() gifFileSelect = new EventEmitter<File>();
  @Output() close = new EventEmitter<void>();

  activeTab: PickerTab = 'emoji';
  searchQuery = '';

  // Emoji data
  emojiCategories: EmojiCategory[] = EMOJI_CATEGORIES;
  selectedEmojiCategory: string = 'smileys';

  // Sticker data
  stickerPacks: StickerPack[] = STICKER_PACKS;
  selectedStickerPack: string = 'all';
  stickers: StickerItem[] = STICKERS;

  // GIF data
  gifCategories = GIF_CATEGORIES;
  selectedGifCategory: string = 'all';
  gifs: GifItem[] = GIFS;

  setTab(tab: PickerTab): void {
    this.activeTab = tab;
    this.searchQuery = '';
  }

  // --- Emojis ---
  get filteredEmojiCategories(): EmojiCategory[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      if (this.selectedEmojiCategory === 'all') return this.emojiCategories;
      return this.emojiCategories.filter((c) => c.id === this.selectedEmojiCategory);
    }
    return this.emojiCategories
      .map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(q) || cat.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.emojis.length > 0);
  }

  selectEmoji(emoji: string, event: Event): void {
    event.stopPropagation();
    this.emojiSelect.emit(emoji);
  }

  // --- Stickers ---
  get filteredStickers(): StickerItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    let list = this.stickers;
    if (this.selectedStickerPack !== 'all') {
      list = list.filter((s) => s.pack === this.selectedStickerPack);
    }
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }

  selectSticker(sticker: StickerItem, event: Event): void {
    event.stopPropagation();
    this.stickerSelect.emit({ url: sticker.url, name: sticker.name });
  }

  // --- GIFs ---
  get filteredGifs(): GifItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    let list = this.gifs;
    if (this.selectedGifCategory !== 'all') {
      list = list.filter((g) => g.category === this.selectedGifCategory);
    }
    if (q) {
      list = list.filter(
        (g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

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
