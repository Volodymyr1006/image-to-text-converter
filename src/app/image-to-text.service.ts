import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../environments/environment';

const API_URL = 'https://api.api-ninjas.com/v1/imagetotext';

/** One piece of text (usually a word) found by the API, with its position on the image. */
export interface TextBlock {
  text: string;
  bounding_box: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * The API returns separate words. This joins them back into readable text:
 * words on the same height go into one line, a word that starts lower begins a new line.
 */
export function blocksToText(blocks: TextBlock[]): string {
  const lines: string[][] = [];
  let lineBottom = -Infinity;

  for (const block of blocks) {
    const box = block.bounding_box;
    const wordMiddle = box ? (box.y1 + box.y2) / 2 : lineBottom;

    if (lines.length === 0 || wordMiddle > lineBottom) {
      lines.push([]);
      lineBottom = box ? box.y2 : lineBottom;
    }

    lines[lines.length - 1].push(block.text);
  }

  return lines.map((words) => words.join(' ')).join('\n');
}

@Injectable({ providedIn: 'root' })
export class ImageToTextService {
  private readonly http = inject(HttpClient);

  /** Sends the image to API Ninjas and returns the recognised text. */
  extractText(image: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http
      .post<TextBlock[]>(API_URL, formData, {
        headers: { 'X-Api-Key': environment.apiNinjasKey },
      })
      .pipe(map((blocks) => blocksToText(blocks ?? [])));
  }
}
