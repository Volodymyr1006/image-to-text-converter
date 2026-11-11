import { MAX_FILE_SIZE_BYTES, validateImageFile } from './image-validation';

function fakeFile(type: string, size: number): File {
  const file = new File(['x'], 'test-file', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validateImageFile', () => {
  it('accepts a JPEG within the size limit', () => {
    expect(validateImageFile(fakeFile('image/jpeg', 1024))).toBeNull();
  });

  it('accepts a PNG of exactly 2 MB', () => {
    expect(validateImageFile(fakeFile('image/png', MAX_FILE_SIZE_BYTES))).toBeNull();
  });

  it('rejects other formats', () => {
    expect(validateImageFile(fakeFile('image/gif', 1024))).toContain('JPEG або PNG');
    expect(validateImageFile(fakeFile('application/pdf', 1024))).toContain('JPEG або PNG');
  });

  it('rejects files larger than 2 MB', () => {
    expect(validateImageFile(fakeFile('image/png', MAX_FILE_SIZE_BYTES + 1))).toContain('завеликий');
  });
});
