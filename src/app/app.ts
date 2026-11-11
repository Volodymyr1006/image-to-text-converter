import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';

import { environment } from '../environments/environment';
import { ImageToTextService } from './image-to-text.service';
import { MAX_FILE_SIZE_MB, formatFileSize, validateImageFile } from './image-validation';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  private readonly imageToText = inject(ImageToTextService);

  protected readonly maxSizeMb = MAX_FILE_SIZE_MB;

  /** The image the user picked (already validated). */
  protected readonly file = signal<File | null>(null);
  /** Temporary browser URL used to show the preview. */
  protected readonly previewUrl = signal<string | null>(null);
  /** Recognised text. `null` means "no request finished yet". */
  protected readonly text = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly copied = signal(false);
  protected readonly dragging = signal(false);

  protected readonly fileInfo = computed(() => {
    const file = this.file();
    return file ? `${file.name} · ${formatFileSize(file.size)}` : '';
  });

  private copiedTimer?: ReturnType<typeof setTimeout>;

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Clear the input so picking the same file again still fires `change`.
    input.value = '';

    if (file) {
      this.setFile(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.setFile(file);
    }
  }

  protected extractText(): void {
    const file = this.file();
    if (!file || this.loading()) {
      return;
    }

    if (!environment.apiNinjasKey || environment.apiNinjasKey.startsWith('YOUR_')) {
      this.error.set(
        'Не вказано API-ключ. Додайте свій ключ API Ninjas у файл src/environments/environment.ts.',
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.text.set(null);

    this.imageToText.extractText(file).subscribe({
      next: (text) => {
        // Ignore the answer if the user picked another image in the meantime.
        if (this.file() === file) {
          this.text.set(text);
          this.loading.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (this.file() === file) {
          this.error.set(this.describeHttpError(err));
          this.loading.set(false);
        }
      },
    });
  }

  protected async copyText(): Promise<void> {
    const text = this.text();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      this.error.set(null);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.error.set('Не вдалося скопіювати текст. Виділіть його та скопіюйте вручну.');
    }
  }

  protected reset(): void {
    this.revokePreview();
    this.file.set(null);
    this.previewUrl.set(null);
    this.text.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.copied.set(false);
  }

  ngOnDestroy(): void {
    this.revokePreview();
    clearTimeout(this.copiedTimer);
  }

  private setFile(file: File): void {
    const validationError = validateImageFile(file);
    if (validationError) {
      // Keep the previously chosen image; just explain why the new one was rejected.
      this.error.set(validationError);
      return;
    }

    this.revokePreview();
    this.file.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.text.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.copied.set(false);
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  private describeHttpError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Не вдалося зʼєднатися із сервером. Перевірте інтернет-зʼєднання та спробуйте ще раз.';
    }

    const apiMessage: unknown = err.error?.error ?? err.error?.message;
    const details = typeof apiMessage === 'string' ? ` (${apiMessage})` : '';

    if (err.status === 401 || err.status === 403) {
      return `API відхилив запит: перевірте API-ключ${details}.`;
    }
    if (err.status === 429) {
      return `Перевищено ліміт запитів до API. Спробуйте пізніше${details}.`;
    }
    return `Помилка розпізнавання, код ${err.status}${details}.`;
  }
}
