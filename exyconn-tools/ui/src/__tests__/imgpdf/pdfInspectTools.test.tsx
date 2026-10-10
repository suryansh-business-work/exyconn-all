import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PDFDocument } from 'pdf-lib';
import { mockCanvasContext } from '../canvasMock';
import {
  captureDownloads,
  contentStreams,
  dropOnZone,
  fileInput,
  jpegFile,
  makeFile,
  makePdf,
  pageCountOf,
  pdfFile,
  pngFile,
  readBytes,
  upload,
  type Download,
} from '../helpers/pdfHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/components/PdfPreview', () => ({
  PdfPreview: ({ file }: { file: File | null }) => (
    <div data-testid="preview">{file ? `preview:${file.name}` : 'empty'}</div>
  ),
}));

import ComparePdf from '../../tools/compare-pdf';
import SignPdf from '../../tools/sign-pdf';
import PdfToPdfa from '../../tools/pdf-to-pdfa';
import JpgToPdf from '../../tools/jpg-to-pdf';

configure({ asyncUtilTimeout: 20000 });

let downloads: Download[];

beforeEach(() => {
  downloads = captureDownloads();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const textFile = () => makeFile('hello', 'notes.txt', 'text/plain');
const brokenPdf = (name = 'broken.pdf') => makeFile('this is not a pdf', name, 'application/pdf');
const withSize = (file: File, size: number) => {
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const dismissWithEscape = async () => {
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.querySelector('.MuiSnackbar-root')).toBeNull());
};
const closeAlert = async (message: string) => {
  fireEvent.click(within(screen.getByText(message).closest('[role="alert"]') as HTMLElement).getByRole('button'));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
};
const choose = async (label: string, option: string) => {
  const unlabeled = label === 'Page Size';
  fireEvent.mouseDown(unlabeled ? screen.getByRole('combobox') : screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByRole('option', { name: option }));
};
const pageSizes = async (blob: Blob) => {
  const doc = await PDFDocument.load(await readBytes(blob));
  return doc.getPages().map((p) => p.getSize());
};
/** The position and size of every image drawn on the PDF, in file order. */
const imagePlacements = async (blob: Blob) => {
  const streams = (await contentStreams(blob)).join('\n');
  const pattern = /q\s+1 0 0 1 ([\d.-]+) ([\d.-]+) cm\s+1 0 0 1 0 0 cm\s+([\d.-]+) 0 0 ([\d.-]+) 0 0 cm/g;
  return [...streams.matchAll(pattern)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    width: Number(m[3]),
    height: Number(m[4]),
  }));
};

describe('compare-pdf', () => {
  const inputs = (container: HTMLElement) =>
    [...container.querySelectorAll('input[type="file"]')] as HTMLInputElement[];
  const give = (input: HTMLInputElement, file: File) => fireEvent.change(input, { target: { files: [file] } });
  const cellsOf = (label: string) =>
    within(screen.getByText(label).closest('tr') as HTMLElement)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);

  it('rejects anything that is not a PDF in either slot', async () => {
    const { container } = render(<ComparePdf />);
    give(inputs(container)[0], textFile());
    expect(await screen.findByText('PDF only')).toBeInTheDocument();
    await dismissWithEscape();
    give(inputs(container)[1], textFile());
    expect(await screen.findByText('PDF only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare PDFs' })).toBeDisabled();
  });

  it('lists every property of two PDFs and marks the ones that differ', async () => {
    const { container } = render(<ComparePdf />);
    const first = await PDFDocument.create();
    first.addPage([200, 300]);
    first.addPage([100, 100]);
    first.setTitle('Alpha');
    const second = await PDFDocument.create();
    second.addPage([200, 300]);
    second.setTitle('Beta');
    const [one] = inputs(container);
    fireEvent.dragOver(screen.getByText('Upload PDF 1').closest('.MuiPaper-root') as HTMLElement);
    fireEvent.dragLeave(screen.getByText('Upload PDF 1').closest('.MuiPaper-root') as HTMLElement);
    give(one, withSize(pdfFile(await first.save(), 'a.pdf'), 2048));
    fireEvent.drop(screen.getByText('Upload PDF 2').closest('.MuiPaper-root') as HTMLElement, {
      dataTransfer: { files: [withSize(pdfFile(await second.save(), 'b.pdf'), 3 * 1024 * 1024)] },
    });
    expect(await screen.findByText('(3.00 MB)')).toBeInTheDocument();
    expect(screen.getAllByTestId('preview')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Compare PDFs' }));
    await screen.findByText('Property');

    expect(cellsOf('Pages').slice(0, 3)).toEqual(['Pages', '2', '1']);
    expect(cellsOf('File Size').slice(0, 3)).toEqual(['File Size', '2.0 KB', '3.00 MB']);
    expect(cellsOf('Title').slice(0, 3)).toEqual(['Title', 'Alpha', 'Beta']);
    expect(cellsOf('Author').slice(0, 3)).toEqual(['Author', '—', '—']);
    expect(cellsOf('Page 1 Size').slice(0, 3)).toEqual(['Page 1 Size', '200×300', '200×300']);
    expect(cellsOf('Page 2 Size').slice(0, 3)).toEqual(['Page 2 Size', '100×100', 'N/A']);
    const row = (label: string) => screen.getByText(label).closest('tr') as HTMLElement;
    expect(within(row('Author')).getByTestId('CheckCircleIcon')).toBeInTheDocument();
    expect(within(row('Title')).getByTestId('CancelIcon')).toBeInTheDocument();
    expect(within(row('Page 2 Size')).getByTestId('CancelIcon')).toBeInTheDocument();
  });

  it('lists the pages only the second PDF has, and clears the table when a file changes', async () => {
    const { container } = render(<ComparePdf />);
    const [one, two] = inputs(container);
    give(one, pdfFile(await makePdf(1, [200, 300]), 'short.pdf'));
    give(two, pdfFile(await makePdf(3, [200, 300]), 'long.pdf'));
    fireEvent.click(screen.getByRole('button', { name: 'Compare PDFs' }));
    await screen.findByText('Property');
    expect(cellsOf('Page 2 Size').slice(0, 3)).toEqual(['Page 2 Size', 'N/A', '200×300']);
    expect(cellsOf('Page 3 Size').slice(0, 3)).toEqual(['Page 3 Size', 'N/A', '200×300']);
    give(one, pdfFile(await makePdf(1), 'other.pdf'));
    await waitFor(() => expect(screen.queryByText('Property')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Compare PDFs' }));
    await screen.findByText('Property');
    give(two, pdfFile(await makePdf(1), 'other2.pdf'));
    await waitFor(() => expect(screen.queryByText('Property')).not.toBeInTheDocument());
  });

  it('reports a PDF that cannot be loaded', async () => {
    const { container } = render(<ComparePdf />);
    const [one, two] = inputs(container);
    give(one, pdfFile(await makePdf(1), 'ok.pdf'));
    give(two, brokenPdf());
    fireEvent.click(screen.getByRole('button', { name: 'Compare PDFs' }));
    expect(await screen.findByText('Failed to load one or both PDFs.')).toBeInTheDocument();
    await closeAlert('Failed to load one or both PDFs.');
  });
});

describe('sign-pdf', () => {
  const rect = { left: 10, top: 20, width: 300, height: 150, right: 310, bottom: 170, x: 10, y: 20 };
  let ctx: Record<string, ReturnType<typeof vi.fn> | string | number>;

  beforeEach(() => {
    ctx = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };
    mockCanvasContext(() => ctx);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
  });

  const canvas = () => document.querySelector('canvas') as HTMLCanvasElement;
  const load = async (container: HTMLElement, pages = 3) => {
    upload(container, pdfFile(await makePdf(pages, [400, 500]), 'contract.pdf'));
    await screen.findByText('contract.pdf', { selector: 'strong' });
  };
  const sign = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Signed PDF' }));
    return downloads.at(-1) as Download;
  };

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<SignPdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    await dismissWithEscape();
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign PDF' })).toBeDisabled();
  });

  it('clears the canvas to white and draws strokes with the mouse', () => {
    render(<SignPdf />);
    expect(canvas().width).toBe(300);
    expect(canvas().height).toBe(150);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
    fireEvent.mouseMove(canvas(), { clientX: 50, clientY: 60 });
    expect(ctx.lineTo).not.toHaveBeenCalled();
    fireEvent.mouseDown(canvas(), { clientX: 40, clientY: 50 });
    expect(ctx.moveTo).toHaveBeenCalledWith(30, 30);
    fireEvent.mouseMove(canvas(), { clientX: 60, clientY: 80 });
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 60);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
    fireEvent.mouseUp(canvas());
    fireEvent.mouseMove(canvas(), { clientX: 70, clientY: 90 });
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(canvas(), { clientX: 15, clientY: 25 });
    fireEvent.mouseLeave(canvas());
    fireEvent.mouseMove(canvas(), { clientX: 70, clientY: 90 });
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Signature' }));
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
  });

  it('draws strokes with touch and redraws the canvas on resize', () => {
    render(<SignPdf />);
    fireEvent.touchStart(canvas(), { touches: [{ clientX: 30, clientY: 40 }] });
    expect(ctx.moveTo).toHaveBeenCalledWith(20, 20);
    fireEvent.touchMove(canvas(), { touches: [{ clientX: 50, clientY: 70 }] });
    expect(ctx.lineTo).toHaveBeenCalledWith(40, 50);
    fireEvent.touchEnd(canvas());
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    fireEvent(globalThis as unknown as Window, new Event('resize'));
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
  });

  it('keeps working when the browser has no 2d canvas', () => {
    mockCanvasContext(() => null);
    render(<SignPdf />);
    fireEvent.mouseDown(canvas(), { clientX: 40, clientY: 50 });
    fireEvent.mouseMove(canvas(), { clientX: 60, clientY: 80 });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Signature' }));
    expect(canvas()).toBeInTheDocument();
  });

  it('stamps the signature on the last page at the bottom right by default', async () => {
    render(<SignPdf />);
    dropOnZone(pdfFile(await makePdf(3, [400, 500]), 'contract.pdf'));
    await screen.findByText('contract.pdf', { selector: 'strong' });
    expect(screen.getByText(/3 page\(s\)/)).toBeInTheDocument();
    const out = await sign();
    expect(out.name).toBe('signed-contract.pdf');
    expect(await pageCountOf(out.blob)).toBe(3);
    expect(await imagePlacements(out.blob)).toEqual([{ width: 140, height: 140, x: 230, y: 30 }]);
  });

  it.each([
    ['Bottom Left', 'First', 'Small', { width: 80, height: 80, x: 30, y: 30 }],
    ['Center', 'First', 'Large', { width: 200, height: 200, x: 100, y: 150 }],
  ])('places %s on the %s page at %s size', async (position, page, size, expected) => {
    const { container } = render(<SignPdf />);
    await load(container, 2);
    await choose('Position', position);
    await choose('Page', page);
    await choose('Size', size);
    const out = await sign();
    expect(await imagePlacements(out.blob)).toEqual([expected]);
  });

  it('stamps every page when asked to', async () => {
    const { container } = render(<SignPdf />);
    await load(container, 3);
    await choose('Page', 'All');
    const out = await sign();
    expect(await imagePlacements(out.blob)).toHaveLength(3);
    upload(container, pdfFile(await makePdf(1), 'next.pdf'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Download Signed PDF' })).not.toBeInTheDocument());
  });

  it('reports a PDF it cannot sign', async () => {
    const { container } = render(<SignPdf />);
    await load(container, 1);
    const embed = vi.spyOn(PDFDocument.prototype, 'embedPng').mockRejectedValueOnce(new Error('bad png'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));
    expect(await screen.findByText('Failed to sign PDF.')).toBeInTheDocument();
    expect(embed).toHaveBeenCalledTimes(1);
    await closeAlert('Failed to sign PDF.');
    expect(downloads).toHaveLength(0);
  });
});

describe('pdf-to-pdfa', () => {
  const load = async (container: HTMLElement, bytes: Uint8Array, name = 'report.pdf') => {
    upload(container, pdfFile(bytes, name));
    await screen.findByText(name);
  };
  const cells = (label: string) =>
    within(screen.getByText(label).closest('tr') as HTMLElement)
      .getAllByRole('cell')
      .map((c) => c.textContent);

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<PdfToPdfa />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    await dismissWithEscape();
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
    await closeAlert('Failed to read PDF.');
  });

  it('fills in a missing title and author and compares the metadata before and after', async () => {
    const { container } = render(<PdfToPdfa />);
    expect(screen.getByRole('button', { name: 'Convert to PDF/A' })).toBeDisabled();
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    dropOnZone(withSize(pdfFile(await doc.save(), 'report.pdf'), 2048));
    await screen.findByText('report.pdf');
    expect(screen.getByText('2.0 KB · 1 page(s)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF/A' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF/A' }));
    expect(cells('Title').slice(0, 3)).toEqual(['Title', '—', 'report']);
    expect(cells('Author').slice(0, 3)).toEqual(['Author', '—', 'Unknown']);
    expect(cells('Creator')[2]).toBe('Exyconn PDF/A Tool');
    expect(cells('Producer')[2]).toMatch(/^pdf-lib/);
    expect(cells('Pages').slice(0, 3)).toEqual(['Pages', '1', '1']);
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toBe('pdfa-report.pdf');
    const saved = await PDFDocument.load(await readBytes(downloads[0].blob));
    expect(saved.getTitle()).toBe('report');
    expect(saved.getAuthor()).toBe('Unknown');
    upload(container, pdfFile(await makePdf(1), 'again.pdf'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Download PDF/A' })).not.toBeInTheDocument());
  });

  it('keeps the title and author a PDF already has, and shows megabyte sizes', async () => {
    const { container } = render(<PdfToPdfa />);
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.setTitle('Annual report');
    doc.setAuthor('Ada');
    upload(container, withSize(pdfFile(await doc.save(), 'report.pdf'), 2 * 1024 * 1024));
    await screen.findByText('2.00 MB · 1 page(s)');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF/A' }));
    await screen.findByRole('button', { name: 'Download PDF/A' });
    expect(cells('Title').slice(0, 3)).toEqual(['Title', 'Annual report', 'Annual report']);
    expect(cells('Author').slice(0, 3)).toEqual(['Author', 'Ada', 'Ada']);
  });

  it('reports a PDF it cannot convert', async () => {
    const { container } = render(<PdfToPdfa />);
    await load(container, await makePdf(1));
    vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF/A' }));
    expect(await screen.findByText('Failed to process PDF.')).toBeInTheDocument();
    await closeAlert('Failed to process PDF.');
  });
});

describe('jpg-to-pdf', () => {
  const convertButton = (name: string | RegExp) => screen.getByRole('button', { name });
  const convert = async (name: string | RegExp) => {
    fireEvent.click(convertButton(name));
    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF' }));
    return downloads.at(-1) as Download;
  };

  it('rejects files that are not images', async () => {
    const { container } = render(<JpgToPdf />);
    expect(screen.getByRole('button', { name: /Convert 0 Images to PDF/ })).toBeDisabled();
    upload(container, textFile());
    expect(await screen.findByText('Please select image files (JPG, PNG, WebP).')).toBeInTheDocument();
    await dismissWithEscape();
  });

  it('puts each image centred on its own A4 page', async () => {
    const { container } = render(<JpgToPdf />);
    upload(container, jpegFile('one.jpg'));
    dropOnZone(pngFile('two.png'), /Drag & Drop Images/);
    expect(await screen.findByText('two.png')).toBeInTheDocument();
    const out = await convert('Convert 2 Images to PDF');
    expect(out.name).toBe('images.pdf');
    const sizes = await pageSizes(out.blob);
    expect(sizes).toHaveLength(2);
    sizes.forEach((size) => {
      expect(size.width).toBeCloseTo(595.28, 1);
      expect(size.height).toBeCloseTo(841.89, 1);
    });
    const [first] = await imagePlacements(out.blob);
    expect(first.width).toBeCloseTo(595.28, 1);
    expect(first.height).toBeCloseTo(595.28, 1);
    expect(first.x).toBeCloseTo(0, 1);
    expect(first.y).toBeCloseTo((841.89 - 595.28) / 2, 1);
  });

  it('uses Letter pages or the size of each image', async () => {
    const { container } = render(<JpgToPdf />);
    upload(container, pngFile('pic.png'));
    expect(screen.getByRole('button', { name: 'Convert 1 Image to PDF' })).toBeEnabled();
    await choose('Page Size', 'Letter (612 x 792)');
    const letter = await convert('Convert 1 Image to PDF');
    expect(await pageSizes(letter.blob)).toEqual([{ width: 612, height: 792 }]);
    await choose('Page Size', 'Fit to Image');
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
    const fit = await convert('Convert 1 Image to PDF');
    expect(await pageSizes(fit.blob)).toEqual([{ width: 1, height: 1 }]);
    expect(await imagePlacements(fit.blob)).toEqual([{ width: 1, height: 1, x: 0, y: 0 }]);
  });

  it('reorders and removes images before converting', async () => {
    const { container } = render(<JpgToPdf />);
    upload(container, pngFile('a.png'), jpegFile('b.jpg'), pngFile('c.png'));
    await screen.findByText('c.png');
    fireEvent.click(screen.getAllByTestId('ArrowDownwardIcon')[0]);
    fireEvent.click(screen.getAllByTestId('ArrowUpwardIcon')[2]);
    const names = screen.getAllByRole('img').map((img) => img.getAttribute('alt'));
    expect(names).toEqual(['b.jpg', 'c.png', 'a.png']);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[1]);
    expect(screen.queryByText('c.png')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    const out = await convert('Convert 2 Images to PDF');
    expect(await pageCountOf(out.blob)).toBe(2);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
  });

  it('reports an image pdf-lib cannot embed', async () => {
    const { container } = render(<JpgToPdf />);
    upload(container, makeFile('RIFFxxxxWEBP', 'pic.webp', 'image/webp'));
    await screen.findByText('pic.webp');
    fireEvent.click(convertButton('Convert 1 Image to PDF'));
    expect(await screen.findByText('Failed to convert images to PDF.')).toBeInTheDocument();
    await closeAlert('Failed to convert images to PDF.');
    expect(fileInput(container)).toBeInTheDocument();
  });
});
