import {
  Component,
  ElementRef,
  Inject,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  HostListener,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';

export interface ImageCropData {
  imageSrc: string; // Data URL or Object URL
}

export interface ImageCropResult {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-image-crop-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  templateUrl: './image-crop-dialog.component.html',
  styleUrls: ['./image-crop-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropDialogComponent implements AfterViewInit {
  @ViewChild('cropCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly zoom = signal<number>(1);
  readonly minZoom = signal<number>(0.5);
  readonly maxZoom = signal<number>(3);
  readonly rotation = signal<number>(0); // 0, 90, 180, 270

  private img: HTMLImageElement = new Image();
  private isLoaded = false;

  // Pan offsets relative to center
  private offsetX = 0;
  private offsetY = 0;

  // Pointer dragging state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startOffsetX = 0;
  private startOffsetY = 0;

  constructor(
    public dialogRef: MatDialogRef<ImageCropDialogComponent, ImageCropResult>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropData
  ) {}

  ngAfterViewInit(): void {
    this.loadImage();
  }

  private loadImage(): void {
    if (!this.data?.imageSrc) return;
    if (!this.data.imageSrc.startsWith('data:') && !this.data.imageSrc.startsWith('blob:')) {
      this.img.crossOrigin = 'anonymous';
    }
    this.img.onload = () => {
      this.isLoaded = true;
      this.initCropScale();
      this.render();
    };
    this.img.onerror = (err) => {
      console.error('Failed to load image for cropping', err);
    };
    this.img.src = this.data.imageSrc;
  }

  private initCropScale(): void {
    const canvas = this.canvasRef.nativeElement;
    const size = Math.min(canvas.clientWidth || 320, canvas.clientHeight || 320) || 320;
    canvas.width = size;
    canvas.height = size;

    if (!this.img.width || !this.img.height) return;

    // Minimum zoom so image at least covers the square crop area
    const minScale = Math.max(size / this.img.width, size / this.img.height);
    this.minZoom.set(Math.max(0.2, minScale * 0.8));
    this.maxZoom.set(Math.max(3, minScale * 4));
    this.zoom.set(minScale);
    this.offsetX = 0;
    this.offsetY = 0;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isLoaded) {
      this.render();
    }
  }

  onZoomChange(newZoom: number): void {
    this.zoom.set(Number(newZoom));
    this.render();
  }

  rotate(): void {
    this.rotation.set((this.rotation() + 90) % 360);
    this.render();
  }

  reset(): void {
    this.rotation.set(0);
    this.initCropScale();
    this.render();
  }

  // Mouse & Touch Dragging Handlers
  onPointerDown(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.startOffsetX = this.offsetX;
    this.startOffsetY = this.offsetY;
  }

  onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    this.offsetX = this.startOffsetX + dx;
    this.offsetY = this.startOffsetY + dy;
    this.render();
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = -Math.sign(event.deltaY) * 0.1;
    const targetZoom = Math.min(this.maxZoom(), Math.max(this.minZoom(), this.zoom() + delta));
    this.zoom.set(Number(targetZoom.toFixed(2)));
    this.render();
  }

  private render(): void {
    if (!this.isLoaded) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Translate to center + user offsets
    ctx.translate(width / 2 + this.offsetX, height / 2 + this.offsetY);
    ctx.rotate((this.rotation() * Math.PI) / 180);
    ctx.scale(this.zoom(), this.zoom());

    // Draw the image centered
    ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
    ctx.restore();
  }

  onConfirm(): void {
    if (!this.isLoaded) return;
    const canvas = this.canvasRef.nativeElement;

    // Export square cropped image with high quality 500x500
    const exportCanvas = document.createElement('canvas');
    const exportSize = 500;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // Scale factor from current canvas display size to 500x500
    const scaleFactor = exportSize / canvas.width;

    exportCtx.save();
    exportCtx.translate(exportSize / 2 + this.offsetX * scaleFactor, exportSize / 2 + this.offsetY * scaleFactor);
    exportCtx.rotate((this.rotation() * Math.PI) / 180);
    exportCtx.scale(this.zoom() * scaleFactor, this.zoom() * scaleFactor);
    exportCtx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
    exportCtx.restore();

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        const previewUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
        this.dialogRef.close({ file, previewUrl });
      },
      'image/jpeg',
      0.92
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

