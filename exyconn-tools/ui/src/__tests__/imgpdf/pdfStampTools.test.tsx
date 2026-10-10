import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PDFDocument, PDFPage } from 'pdf-lib';
import {
  captureDownloads,
  contentStreams,
  drawnText,
  dropOnZone,
  makeFile,
  makePdf,
  pdfFile,
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

import CompressPdf from '../../tools/compress-pdf';
import RepairPdf from '../../tools/repair-pdf';
import RedactPdf from '../../tools/redact-pdf';
import PdfPageNumbers from '../../tools/pdf-page-numbers';
import WatermarkPdf from '../../tools/watermark-pdf';

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
/** Closes the open message with Escape and waits until its Snackbar has left the DOM. */
const dismissWithEscape = async () => {
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.querySelector('.MuiSnackbar-root')).toBeNull());
};
const closeAlert = async (message: string) => {
  fireEvent.click(within(screen.getByText(message).closest('[role="alert"]') as HTMLElement).getByRole('button'));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
};
/** A PDF that reads fine `okReads` times and then fails with `reason`. */
function failsAfter(okReads: number, name: string, bytes: Uint8Array, reason: unknown) {
  const file = pdfFile(bytes, name);
  const read = file.arrayBuffer.bind(file);
  let reads = 0;
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => (++reads > okReads ? Promise.reject(reason) : read()),
  });
  return file;
}
const rejectsNonPdf = async (container: HTMLElement) => {
  upload(container, textFile());
  expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
  dismissWithEscape();
  await waitFor(() => expect(screen.queryByText('Please select a PDF file.')).not.toBeInTheDocument());
};
const pageOf = async (blob: Blob, index = 0): Promise<PDFPage> => {
  const doc = await PDFDocument.load(await readBytes(blob));
  return doc.getPage(index);
};

describe('compress-pdf', () => {
  it('rejects non-PDF files', async () => {
    const { container } = render(<CompressPdf />);
    await rejectsNonPdf(container);
  });

  it('re-serialises the PDF, reports the sizes and downloads it', async () => {
    const { container } = render(<CompressPdf />);
    expect(screen.getByRole('button', { name: 'Compress PDF' })).toBeDisabled();
    dropOnZone(withSize(pdfFile(await makePdf(2), 'big.pdf'), 3 * 1024 * 1024));
    expect(await screen.findByText('big.pdf')).toBeInTheDocument();
    expect(screen.getByText('Original size: 3.00 MB')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Compress PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Compressed PDF' }));
    expect(screen.getByText('Compressed')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(downloads[0].name).toBe('compressed-big.pdf');
    expect(downloads[0].blob.size).toBeGreaterThan(0);
    expect((await pageOf(downloads[0].blob)).getSize()).toEqual({ width: 200, height: 300 });
    upload(container, pdfFile(await makePdf(1), 'next.pdf'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Download Compressed PDF' })).not.toBeInTheDocument()
    );
  });

  it('flags a result that is larger than the original', async () => {
    const { container } = render(<CompressPdf />);
    upload(container, withSize(pdfFile(await makePdf(1), 'tiny.pdf'), 10));
    await screen.findByText('tiny.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Compress PDF' }));
    await screen.findByRole('button', { name: 'Download Compressed PDF' });
    expect(screen.getByText(/^-\d+\.\d%$/)).toBeInTheDocument();
  });

  it('reports a PDF it cannot compress', async () => {
    const { container } = render(<CompressPdf />);
    upload(container, brokenPdf());
    await screen.findByText('broken.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Compress PDF' }));
    expect(await screen.findByText('Failed to compress PDF.')).toBeInTheDocument();
    await closeAlert('Failed to compress PDF.');
    expect(downloads).toHaveLength(0);
  });
});

describe('repair-pdf', () => {
  it('rejects files that are neither PDF typed nor .pdf named', async () => {
    const { container } = render(<RepairPdf />);
    await rejectsNonPdf(container);
  });

  it('repairs a PDF, shows its metadata and downloads it', async () => {
    const { container } = render(<RepairPdf />);
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.addPage([100, 100]);
    doc.setTitle('Annual report');
    doc.setAuthor('Ada');
    dropOnZone(withSize(pdfFile(await doc.save(), 'report.pdf'), 2 * 1024 * 1024), /Drag & Drop PDF/);
    await screen.findByText('Size: 2.00 MB');
    fireEvent.click(screen.getByRole('button', { name: 'Attempt Repair' }));
    expect(await screen.findByText(/PDF loaded successfully/)).toBeInTheDocument();
    expect(screen.getByText('Annual report')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download Repaired PDF' }));
    expect(downloads[0].name).toBe('repaired-report.pdf');
    expect((await pageOf(downloads[0].blob)).getSize()).toEqual({ width: 100, height: 100 });
    upload(container, pdfFile(await makePdf(1), 'other.pdf'));
    await waitFor(() => expect(screen.queryByText(/PDF loaded successfully/)).not.toBeInTheDocument());
  });

  it('shows a dash for metadata the PDF lacks and accepts a .pdf name without a type', async () => {
    const { container } = render(<RepairPdf />);
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    delete (doc.context.trailerInfo as { Info?: unknown }).Info;
    upload(container, makeFile((await doc.save()) as BlobPart, 'untyped.pdf', ''));
    await screen.findByText('untyped.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Attempt Repair' }));
    await screen.findByText(/PDF loaded successfully/);
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText(/pdf-lib/)).toBeInTheDocument();
  });

  it('closes the message for a file it refuses with its close button', async () => {
    const { container } = render(<RepairPdf />);
    upload(container, textFile());
    await screen.findByText('Please select a PDF file.');
    await closeAlert('Please select a PDF file.');
  });

  it('shows the parser message for a PDF that cannot be loaded', async () => {
    const { container } = render(<RepairPdf />);
    upload(container, brokenPdf());
    await screen.findByText('broken.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Attempt Repair' }));
    expect(await screen.findByText(/Failed to load/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to parse PDF document/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download Repaired PDF' })).not.toBeInTheDocument();
  });

  it('uses a generic message for a failure that is not an Error', async () => {
    const { container } = render(<RepairPdf />);
    upload(container, failsAfter(0, 'odd.pdf', await makePdf(1), 'denied'));
    await screen.findByText('odd.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Attempt Repair' }));
    expect(await screen.findByText('Unknown error occurred')).toBeInTheDocument();
  });
});

describe('redact-pdf', () => {
  const load = async (container: HTMLElement, pages = 2) => {
    upload(container, pdfFile(await makePdf(pages, [200, 300]), 'secret.pdf'));
    await screen.findByText(`${pages} page(s)`, { exact: false });
  };
  const field = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const add = () => fireEvent.click(screen.getByRole('button', { name: 'Add' }));

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<RedactPdf />);
    await rejectsNonPdf(container);
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
  });

  it('validates the page and the size of each redaction', async () => {
    const { container } = render(<RedactPdf />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    await load(container, 2);
    field('Page', '3');
    add();
    expect(await screen.findByText('Page must be between 1 and 2')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Page must be between 1 and 2')).not.toBeInTheDocument());
    field('Page', '1');
    field('Width', '0');
    add();
    expect(await screen.findByText('Width and height must be positive')).toBeInTheDocument();
    field('Width', '50');
    field('Height', '-1');
    add();
    expect(screen.getByRole('button', { name: 'Apply 0 Redaction(s) & Download' })).toBeDisabled();
  });

  it('lists, removes and applies black boxes on the chosen pages', async () => {
    const { container } = render(<RedactPdf />);
    dropOnZone(pdfFile(await makePdf(2, [200, 300]), 'secret.pdf'));
    await screen.findByText(/2 page\(s\)/);
    field('X (pt)', '10');
    field('Y (pt)', '20');
    field('Width', '30');
    field('Height', '40');
    add();
    field('Page', '2');
    field('X (pt)', '50');
    add();
    field('Page', '1');
    add();
    expect(screen.getByText('Page 1: (10, 20) 30×40 pt')).toBeInTheDocument();
    expect(screen.getByText('Page 2: (50, 20) 30×40 pt')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[2]);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[1]);
    expect(screen.queryByText(/Page 2:/)).not.toBeInTheDocument();
    field('Page', '2');
    field('X (pt)', '60');
    add();

    fireEvent.click(screen.getByRole('button', { name: 'Apply 2 Redaction(s) & Download' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Redacted PDF' }));
    expect(downloads[0].name).toBe('redacted-secret.pdf');
    const first = (await contentStreams(downloads[0].blob)).join('\n');
    expect(first).toContain('1 0 0 1 10 20 cm');
    expect(first).toContain('1 0 0 1 60 20 cm');
    expect(first).not.toContain('1 0 0 1 50 20 cm');
    expect(first.match(/30 40 l/g)).toHaveLength(2);
    expect(first.match(/0 0 0 rg/g)).toHaveLength(2);
    upload(container, pdfFile(await makePdf(1), 'again.pdf'));
    await waitFor(() => expect(screen.queryByText(/Page 1:/)).not.toBeInTheDocument());
  });

  it('shows megabyte sizes and reports a redaction that cannot be drawn', async () => {
    const { container } = render(<RedactPdf />);
    upload(container, withSize(pdfFile(await makePdf(1), 'big.pdf'), 2 * 1024 * 1024));
    await screen.findByText(/2\.00 MB/);
    add();
    vi.spyOn(PDFPage.prototype, 'drawRectangle').mockImplementationOnce(() => {
      throw new Error('boom');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply 1 Redaction(s) & Download' }));
    expect(await screen.findByText('Failed to apply redactions.')).toBeInTheDocument();
    await closeAlert('Failed to apply redactions.');
    expect(downloads).toHaveLength(0);
  });
});

describe('pdf-page-numbers', () => {
  const load = async (container: HTMLElement, pages = 3) => {
    upload(container, pdfFile(await makePdf(pages, [200, 300]), 'doc.pdf'));
    await screen.findByText('doc.pdf');
  };
  const choose = async (label: string, option: string) => {
    fireEvent.mouseDown(screen.getAllByRole('combobox')[label === 'Position' ? 0 : 1]);
    fireEvent.click(await screen.findByRole('option', { name: option }));
  };
  const run = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Page Numbers' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Numbered PDF' }));
    return drawnText(downloads[0].blob);
  };

  it('rejects non-PDF files', async () => {
    const { container } = render(<PdfPageNumbers />);
    await rejectsNonPdf(container);
  });

  it('numbers each page at the bottom centre by default', async () => {
    const { container } = render(<PdfPageNumbers />);
    expect(screen.getByRole('button', { name: 'Add Page Numbers' })).toBeDisabled();
    dropOnZone(pdfFile(await makePdf(2, [200, 300]), 'doc.pdf'));
    await screen.findByText('doc.pdf');
    const runs = await run();
    expect(downloads[0].name).toBe('numbered-doc.pdf');
    expect(runs.map((r) => r.text)).toEqual(['1', '2']);
    expect(runs[0].y).toBe(30);
    expect(runs[0].x).toBeGreaterThan(90);
    expect(runs[0].x).toBeLessThan(105);
    upload(container, pdfFile(await makePdf(1), 'next.pdf'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Download Numbered PDF' })).not.toBeInTheDocument()
    );
  });

  it.each([
    ['Bottom Left', 30, 30],
    ['Bottom Right', 170, 30],
    ['Top Center', 100, 270],
    ['Top Left', 30, 270],
    ['Top Right', 170, 270],
  ])('places numbers at %s', async (option, approxX, y) => {
    const { container } = render(<PdfPageNumbers />);
    await load(container, 1);
    await choose('Position', option);
    const [run1] = await run();
    expect(run1.y).toBe(y);
    expect(Math.abs(run1.x - approxX)).toBeLessThan(10);
  });

  it('uses the chosen format, start number and font size', async () => {
    const { container } = render(<PdfPageNumbers />);
    await load(container, 2);
    await choose('Format', 'Page 1, Page 2...');
    fireEvent.change(screen.getByLabelText('Start Number'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Font Size'), { target: { value: '2' } });
    const runs = await run();
    expect(runs.map((r) => r.text)).toEqual(['Page 5', 'Page 6']);
    expect(screen.getByLabelText('Font Size')).toHaveValue(6);
  });

  it('writes "n of N" with the last number as N', async () => {
    const { container } = render(<PdfPageNumbers />);
    await load(container, 3);
    await choose('Format', '1 of N, 2 of N...');
    fireEvent.change(screen.getByLabelText('Start Number'), { target: { value: '0' } });
    expect(screen.getByLabelText('Start Number')).toHaveValue(1);
    const runs = await run();
    expect(runs.map((r) => r.text)).toEqual(['1 of 3', '2 of 3', '3 of 3']);
  });

  it('shows megabyte sizes and reports a PDF it cannot number', async () => {
    const { container } = render(<PdfPageNumbers />);
    upload(container, withSize(brokenPdf(), 2 * 1024 * 1024));
    await screen.findByText(/2\.00 MB/);
    fireEvent.click(screen.getByRole('button', { name: 'Add Page Numbers' }));
    expect(await screen.findByText('Failed to add page numbers.')).toBeInTheDocument();
    await closeAlert('Failed to add page numbers.');
  });
});

describe('watermark-pdf', () => {
  const load = async (container: HTMLElement, pages = 2) => {
    upload(container, pdfFile(await makePdf(pages, [200, 300]), 'doc.pdf'));
    await screen.findByText('doc.pdf', { exact: false, selector: 'strong' });
  };
  const slide = (index: number, value: string) =>
    fireEvent.change(screen.getAllByRole('slider')[index], { target: { value } });

  it('rejects non-PDF files', async () => {
    const { container } = render(<WatermarkPdf />);
    await rejectsNonPdf(container);
  });

  it('stamps the default text at the centre of every page', async () => {
    const { container } = render(<WatermarkPdf />);
    expect(screen.getByRole('button', { name: 'Apply Watermark' })).toBeDisabled();
    dropOnZone(withSize(pdfFile(await makePdf(2, [200, 300]), 'doc.pdf'), 2 * 1024 * 1024));
    await screen.findByText(/2\.00 MB/);
    fireEvent.click(screen.getByRole('button', { name: 'Apply Watermark' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Watermarked PDF' }));
    expect(downloads[0].name).toBe('watermarked-doc.pdf');
    const runs = await drawnText(downloads[0].blob);
    expect(runs.map((r) => r.text)).toEqual(['CONFIDENTIAL', 'CONFIDENTIAL']);
    expect(runs[0].matrix[0]).toBeCloseTo(Math.cos(Math.PI / 4), 3);
    expect(runs[0].matrix[1]).toBeCloseTo(Math.sin(Math.PI / 4), 3);
    upload(container, pdfFile(await makePdf(1), 'next.pdf'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Download Watermarked PDF' })).not.toBeInTheDocument()
    );
  });

  it('applies the chosen text, size, opacity, rotation and colour', async () => {
    const { container } = render(<WatermarkPdf />);
    await load(container, 1);
    fireEvent.change(screen.getByLabelText('Watermark Text'), { target: { value: 'DRAFT' } });
    slide(0, '80');
    slide(1, '0.5');
    slide(2, '-90');
    expect(screen.getByText('Font Size: 80px')).toBeInTheDocument();
    expect(screen.getByText('Opacity: 0.5')).toBeInTheDocument();
    expect(screen.getByText('Rotation: -90°')).toBeInTheDocument();
    const color = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(color, { target: { value: '#ff0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Watermark' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Watermarked PDF' }));
    const streams = (await contentStreams(downloads[0].blob)).join('\n');
    expect(streams).toContain('1 0 0 rg');
    expect(streams).toContain('/Helvetica');
    const [run] = await drawnText(downloads[0].blob);
    expect(run.text).toBe('DRAFT');
    expect(run.matrix[1]).toBeCloseTo(-1, 3);
    expect(streams).toContain('/ca 0.5');
    expect(streams).toContain('80 Tf');
  });

  it('asks for text when it is blank and reports a PDF it cannot stamp', async () => {
    const { container } = render(<WatermarkPdf />);
    upload(container, brokenPdf());
    await screen.findByText('broken.pdf', { selector: 'strong' });
    fireEvent.change(screen.getByLabelText('Watermark Text'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Watermark' }));
    expect(await screen.findByText('Enter watermark text.')).toBeInTheDocument();
    await closeAlert('Enter watermark text.');
    fireEvent.change(screen.getByLabelText('Watermark Text'), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Watermark' }));
    expect(await screen.findByText('Failed to add watermark.')).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
  });
});
