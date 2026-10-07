import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportRichText } from '../../../src/export';
import { loadImages } from '../../../src/export/images';
import { saveBlob } from '../../../src/export/save';
import { docxPart } from './docx-xml';

const pdf = vi.hoisted(() => {
  const blob = new Blob(['%PDF'], { type: 'application/pdf' });
  return {
    blob,
    fonts: { 'Roboto-Regular.ttf': 'AAAA' },
    addVirtualFileSystem: vi.fn(),
    createPdf: vi.fn(() => ({ getBlob: vi.fn(async () => blob) })),
  };
});

vi.mock('pdfmake/build/pdfmake', () => ({
  default: { addVirtualFileSystem: pdf.addVirtualFileSystem, createPdf: pdf.createPdf },
}));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: pdf.fonts }));
vi.mock('../../../src/export/save', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/export/save')>()),
  saveBlob: vi.fn(),
}));
vi.mock('../../../src/export/images', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/export/images')>();
  return { ...actual, loadImages: vi.fn(actual.loadImages) };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('exportRichText', () => {
  it('writes a PDF with pdfmake and saves it under the title', async () => {
    await exportRichText('<h1>Offer</h1><p>Welcome</p>', { format: 'pdf', title: 'Offer: Acme' });

    expect(pdf.addVirtualFileSystem).toHaveBeenCalledWith(pdf.fonts);
    expect(pdf.createPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        info: { title: 'Offer: Acme' },
        content: [
          expect.objectContaining({ text: [expect.objectContaining({ text: 'Offer' })] }),
          expect.objectContaining({ text: [expect.objectContaining({ text: 'Welcome' })] }),
        ],
      }),
    );
    expect(saveBlob).toHaveBeenCalledWith(pdf.blob, 'Offer- Acme.pdf');
  });

  it('writes a Word file and saves it under the title', async () => {
    await exportRichText('<p>Clause one</p>', { format: 'docx', title: '' });

    expect(pdf.createPdf).not.toHaveBeenCalled();
    expect(saveBlob).toHaveBeenCalledTimes(1);
    const [blob, name] = vi.mocked(saveBlob).mock.calls[0] ?? [];
    expect(name).toBe('document.docx');
    expect(await docxPart(blob as Blob)).toContain('Clause one');
  });

  it('saves nothing when an image cannot be loaded', async () => {
    vi.mocked(loadImages).mockRejectedValueOnce(new Error('Image refused'));
    await expect(
      exportRichText('<img src="https://x.test/a.png" alt="A">', { format: 'pdf', title: 'Doc' }),
    ).rejects.toThrow('Image refused');
    expect(saveBlob).not.toHaveBeenCalled();
  });
});
