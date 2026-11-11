export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

/**
 * Checks the file against the task rules: JPEG or PNG only, at most 2 MB.
 * Returns an error message for the user, or null when the file is fine.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Непідтримуваний формат. Дозволені лише зображення JPEG або PNG.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Файл завеликий (${formatFileSize(file.size)}). Максимальний розмір — ${MAX_FILE_SIZE_MB} МБ.`;
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}
