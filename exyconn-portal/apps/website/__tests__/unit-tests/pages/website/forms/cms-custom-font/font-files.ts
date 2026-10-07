/**
 * A font file as the picker hands it over. `size` overrides the reported size, so a test can
 * stand for a large file without allocating one.
 */
export function fontFile(name: string, size?: number): File {
  const file = new File(['font-bytes'], name, { type: '' });
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}
