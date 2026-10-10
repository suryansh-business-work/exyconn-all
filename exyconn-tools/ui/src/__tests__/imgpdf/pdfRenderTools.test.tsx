import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PDFDocument } from 'pdf-lib';
import { mockCanvasContext } from '../canvasMock';
import {
  captureDownloads,
  drawnText,
  dropOnZone,
  fileInput,
  makeFile,
  makePdf,
  pageCountOf,
  pdfFile,
  readBytes,
  upload,
  type Download,
} from '../helpers/pdfHarness';

const pdfjs = vi.hoisted(() => ({
  numPages: 2,
  getDocument: vi.fn(),
  getPage: vi.fn(),
  render: vi.fn(),
  gate: null as Promise<void> | null,
}));
const tesseract = vi.hoisted(() => ({ recognize: vi.fn() }));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: pdfjs.getDocument,
}));
vi.mock('tesseract.js', () => ({ default: { recognize: tesseract.recognize } }));
vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/components/PdfPreview', () => ({
  PdfPreview: ({ file }: { file: File | null }) => (
    <div data-testid="preview">{file ? `preview:${file.name}` : 'empty'}</div>
  ),
}));

import OcrPdf from '../../tools/ocr-pdf';
import PdfToJpg from '../../tools/pdf-to-jpg';
import EditPdf from '../../tools/edit-pdf';

configure({ asyncUtilTimeout: 20000 });

let downloads: Download[];
let anchorClicks: { name: string; href: string }[];

beforeEach(() => {
  downloads = captureDownloads();
  anchorClicks = [];
  pdfjs.numPages = 2;
  pdfjs.gate = null;
  pdfjs.render.mockReset().mockImplementation(() => ({
    promise: pdfjs.gate ?? Promise.resolve(),
  }));
  pdfjs.getPage.mockReset().mockImplementation(async () => ({
    getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 200 * scale }),
    render: pdfjs.render,
  }));
  pdfjs.getDocument.mockReset().mockImplementation(() => ({
    promise: Promise.resolve({ numPages: pdfjs.numPages, getPage: pdfjs.getPage }),
  }));
  tesseract.recognize.mockReset().mockImplementation(async () => ({ data: { text: 'recognised' } }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    anchorClicks.push({ name: this.download, href: this.href });
    downloads.push({
      name: this.download,
      blob: (URL.createObjectURL as unknown as { mock: { calls: Blob[][] } }).mock.calls.at(-1)?.[0] as Blob,
    });
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const textFile = () => makeFile('hello', 'notes.txt', 'text/plain');
const brokenPdf = () => makeFile('this is not a pdf', 'broken.pdf', 'application/pdf');
const dismissWithEscape = async () => {
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.querySelector('.MuiSnackbar-root')).toBeNull());
};
const closeAlert = async (message: string) => {
  fireEvent.click(within(screen.getByText(message).closest('[role="alert"]') as HTMLElement).getByRole('button'));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
};
const gate = () => {
  let open!: () => void;
  pdfjs.gate = new Promise<void>((resolve) => {
    open = resolve;
  });
  return open;
};

describe('ocr-pdf', () => {
  const zone = () => screen.getByRole('heading', { level: 6 }).closest('.MuiPaper-root') as HTMLElement;
  const load = async (container: HTMLElement, name = 'scan.pdf') => {
    upload(container, pdfFile(await makePdf(2), name));
    await screen.findByText(name);
  };
  const extract = () => fireEvent.click(screen.getByRole('button', { name: 'Extract Text' }));

  it('ignores files that are not PDFs and opens the picker from the drop zone', async () => {
    const { container } = render(<OcrPdf />);
    expect(screen.getByRole('button', { name: 'Extract Text' })).toBeDisabled();
    upload(container, textFile());
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
    fireEvent.change(fileInput(container), { target: { files: [] } });
    fireEvent.dragOver(zone());
    fireEvent.drop(zone(), { dataTransfer: { files: [] } });
    fireEvent.drop(zone(), { dataTransfer: { files: [textFile()] } });
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
    const open = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    fireEvent.click(zone());
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('reads every page with the chosen language and joins the text by page', async () => {
    const { container } = render(<OcrPdf />);
    dropOnZone(pdfFile(await makePdf(2), 'scan.pdf'), /Drop PDF here/);
    await screen.findByText('scan.pdf');
    expect(screen.getByText(/KB$/)).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'OCR Language' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Spanish' }));
    tesseract.recognize
      .mockResolvedValueOnce({ data: { text: 'primera' } })
      .mockResolvedValueOnce({ data: { text: 'segunda' } });
    const open = gate();
    extract();
    expect(await screen.findByText('Processing page 1 of 2...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'OCR Language' })).toHaveAttribute('aria-disabled', 'true');
    const openPicker = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    fireEvent.click(zone());
    expect(openPicker).not.toHaveBeenCalled();
    open();
    expect(await screen.findByText(/--- Page 2 ---/)).toBeInTheDocument();
    const text = screen.getByText(/--- Page 1 ---/).textContent;
    expect(text).toBe('--- Page 1 ---\nprimera\n\n--- Page 2 ---\nsegunda\n\n');
    expect(tesseract.recognize).toHaveBeenCalledTimes(2);
    expect(tesseract.recognize.mock.calls[0][0]).toBeInstanceOf(HTMLCanvasElement);
    expect(tesseract.recognize.mock.calls.map((call) => call[1])).toEqual(['spa', 'spa']);
    expect(pdfjs.getDocument.mock.calls[0][0].data.byteLength).toBeGreaterThan(0);
    expect(pdfjs.getPage.mock.calls.map((call) => call[0])).toEqual([1, 2]);
    expect(container).toBeTruthy();
  });

  it('copies the text, then downloads it under the PDF name', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { container } = render(<OcrPdf />);
    await load(container, 'scan.pdf');
    extract();
    await screen.findByText(/--- Page 2 ---/);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.click(screen.getByRole('button', { name: 'Copy Text' }));
    expect(writeText).toHaveBeenCalledWith('--- Page 1 ---\nrecognised\n\n--- Page 2 ---\nrecognised\n\n');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy Text' })).toBeInTheDocument();
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Download as TXT' }));
    expect(anchorClicks[0].name).toBe('scan-extracted.txt');
    expect(downloads[0].blob.type).toBe('text/plain');
    expect(new TextDecoder().decode(await readBytes(downloads[0].blob))).toContain('--- Page 1 ---');
  });

  it('names the download "ocr" when the PDF has no base name, and resets everything', async () => {
    const { container } = render(<OcrPdf />);
    await load(container, '.pdf');
    extract();
    await screen.findByText(/--- Page 1 ---/);
    fireEvent.click(screen.getByRole('button', { name: 'Download as TXT' }));
    expect(anchorClicks[0].name).toBe('ocr-extracted.txt');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
    expect(screen.queryByText(/--- Page 1 ---/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract Text' })).toBeDisabled();
  });

  it('shows an error line in place of text when the PDF cannot be processed', async () => {
    const { container } = render(<OcrPdf />);
    await load(container);
    pdfjs.getDocument.mockImplementationOnce(() => ({ promise: Promise.reject(new Error('corrupt')) }));
    extract();
    expect(await screen.findByText('Error: Failed to process PDF.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract Text' })).toBeEnabled();
  });

  it('clears the previous text when another PDF is chosen', async () => {
    const { container } = render(<OcrPdf />);
    await load(container, 'one.pdf');
    extract();
    await screen.findByText(/--- Page 1 ---/);
    await load(container, 'two.pdf');
    expect(screen.queryByText(/--- Page 1 ---/)).not.toBeInTheDocument();
  });
});

describe('pdf-to-jpg', () => {
  const pickWithDialog = async (file: File | null) => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    fireEvent.click(screen.getByText(/Drop a PDF here|\.pdf/).closest('.MuiPaper-root') as HTMLElement);
    const input = click.mock.contexts[0] as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.pdf');
    Object.defineProperty(input, 'files', { value: file ? [file] : [] });
    await act(async () => {
      input.onchange?.(new Event('change'));
    });
  };
  const convertButton = () => screen.getByRole('button', { name: /Convert/ });

  it('opens a file dialog, counts the pages and ignores a cancelled dialog', async () => {
    render(<PdfToJpg />);
    await pickWithDialog(null);
    expect(screen.queryByText('Convert to JPG')).not.toBeInTheDocument();
    await pickWithDialog(pdfFile(await makePdf(2), 'book.pdf'));
    expect(await screen.findByText('book.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 page(s)')).toBeInTheDocument();
    expect(screen.getByText('Quality: 85%')).toBeInTheDocument();
  });

  it('ignores dropped files that are not PDFs, and accepts a dropped PDF', async () => {
    render(<PdfToJpg />);
    const zone = screen.getByText('Drop a PDF here or click to upload').closest('.MuiPaper-root') as HTMLElement;
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    fireEvent.drop(zone, { dataTransfer: { files: [textFile()] } });
    expect(screen.queryByText('Convert to JPG')).not.toBeInTheDocument();
    fireEvent.drop(zone, { dataTransfer: { files: [pdfFile(await makePdf(1), 'one.pdf')] } });
    expect(await screen.findByText('one.pdf')).toBeInTheDocument();
  });

  it('renders each page at the chosen scale and quality and offers every page', async () => {
    pdfjs.numPages = 3;
    render(<PdfToJpg />);
    await pickWithDialog(pdfFile(await makePdf(3), 'book.pdf'));
    await screen.findByText('3 page(s)');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '70' } });
    expect(screen.getByText('Quality: 70%')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: '3x' }));
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    const open = gate();
    fireEvent.click(convertButton());
    expect(await screen.findByText('Converting page 1 of 3...')).toBeInTheDocument();
    open();
    await screen.findByText('Download All (3)');
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual(['Page 1', 'Page 2', 'Page 3']);
    expect(toBlob).toHaveBeenCalledTimes(3);
    expect(toBlob.mock.calls[0].slice(1)).toEqual(['image/jpeg', 0.7]);
    const pageCanvas = pdfjs.render.mock.calls[0][0].canvas as HTMLCanvasElement;
    expect([pageCanvas.width, pageCanvas.height]).toEqual([300, 600]);

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(anchorClicks.at(-1)?.name).toBe('page-2.jpg');
    expect(anchorClicks.at(-1)?.href).toContain('blob:captured-');
  });

  it('downloads all pages one after another', async () => {
    render(<PdfToJpg />);
    await pickWithDialog(pdfFile(await makePdf(2), 'book.pdf'));
    await screen.findByText('2 page(s)');
    fireEvent.click(convertButton());
    await screen.findByText('Download All (2)');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.click(screen.getByRole('button', { name: /Download All/ }));
    expect(anchorClicks).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(anchorClicks.map((c) => c.name)).toEqual(['page-1.jpg', 'page-2.jpg']);
  });

  it('releases the images and the file on reset', async () => {
    render(<PdfToJpg />);
    await pickWithDialog(pdfFile(await makePdf(2), 'book.pdf'));
    await screen.findByText('2 page(s)');
    fireEvent.click(convertButton());
    await screen.findByText('Download All (2)');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Drop a PDF here or click to upload')).toBeInTheDocument();
    expect(screen.queryByText('Download All (2)')).not.toBeInTheDocument();
  });

  it('reports a PDF it cannot read, and a conversion that fails', async () => {
    render(<PdfToJpg />);
    pdfjs.getDocument.mockImplementationOnce(() => ({ promise: Promise.reject(new Error('corrupt')) }));
    await pickWithDialog(brokenPdf());
    expect(await screen.findByText('Could not read PDF.')).toBeInTheDocument();
    expect(screen.queryByText('broken.pdf')).not.toBeInTheDocument();
    await pickWithDialog(pdfFile(await makePdf(2), 'book.pdf'));
    await screen.findByText('book.pdf');
    expect(screen.queryByText('Could not read PDF.')).not.toBeInTheDocument();
    pdfjs.render.mockImplementationOnce(() => ({ promise: Promise.reject(new Error('render failed')) }));
    fireEvent.click(convertButton());
    expect(await screen.findByText('Failed to convert PDF.')).toBeInTheDocument();
    expect(convertButton()).toHaveTextContent('Convert to JPG');
    expect(convertButton()).toBeEnabled();
    await closeAlert('Failed to convert PDF.');
  });
});

describe('edit-pdf', () => {
  const rect = { left: 0, top: 0, width: 150, height: 300, right: 150, bottom: 300, x: 0, y: 0 };
  let ctx: { fillText: ReturnType<typeof vi.fn>; font?: string; fillStyle?: string };
  const canvas = () => document.querySelector('canvas') as HTMLCanvasElement;
  const load = async (container: HTMLElement, name = 'doc.pdf', pages = 2) => {
    upload(container, pdfFile(await makePdf(pages, [100, 200]), name));
    await screen.findByText('Page 1 / ' + pdfjs.numPages);
  };
  const clickAt = (x: number, y: number) => fireEvent.click(canvas(), { clientX: x, clientY: y });
  const annotate = (text: string) => {
    fireEvent.change(screen.getByLabelText('Text Content'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Annotation' }));
  };

  beforeEach(() => {
    ctx = { fillText: vi.fn() };
    mockCanvasContext(() => ctx);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
  });

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<EditPdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    await dismissWithEscape();
    pdfjs.getDocument.mockImplementationOnce(() => ({ promise: Promise.reject(new Error('corrupt')) }));
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
    await closeAlert('Failed to read PDF.');
  });

  it('renders the page at 1.5x, steps between pages and paints annotations on their page', async () => {
    const { container } = render(<EditPdf />);
    dropOnZone(pdfFile(await makePdf(2, [100, 200]), 'doc.pdf'));
    await screen.findByText('Page 1 / 2');
    await waitFor(() => expect(canvas().width).toBe(150));
    expect(canvas().height).toBe(300);
    expect(pdfjs.getPage).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('button', { name: 'Download Edited PDF' })).toBeDisabled();
    expect(screen.getByText('Click on the PDF preview to set position')).toBeInTheDocument();

    clickAt(75, 100);
    expect(screen.getByText('Click position (PDF): x=50, y=133')).toBeInTheDocument();
    expect(screen.getByText('Position: (50, 133) on page 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Annotation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Font Size'), { target: { value: '20' } });
    fireEvent.change(container.querySelector('input[type="color"]') as HTMLInputElement, {
      target: { value: '#ff0000' },
    });
    annotate('Hello');
    expect(screen.getByText('"Hello" — page 1')).toBeInTheDocument();
    expect(screen.getByText('x:50 y:133 size:20')).toBeInTheDocument();
    await waitFor(() => expect(ctx.fillText).toHaveBeenCalledWith('Hello', 75, 300 - 133 * 1.5));
    expect(ctx.font).toBe('30px Helvetica, Arial, sans-serif');
    expect(ctx.fillStyle).toBe('#ff0000');
    expect(screen.getByLabelText('Text Content')).toHaveValue('');
    expect(screen.queryByText(/Click position/)).not.toBeInTheDocument();

    ctx.fillText.mockClear();
    const buttons = screen.getAllByRole('button').filter((b) => b.querySelector('[data-testid^="Navigate"]'));
    expect(buttons[0]).toBeDisabled();
    fireEvent.click(buttons[1]);
    await screen.findByText('Page 2 / 2');
    expect(pdfjs.getPage).toHaveBeenLastCalledWith(2);
    expect(buttons[1]).toBeDisabled();
    await waitFor(() => expect(pdfjs.render).toHaveBeenCalledTimes(3));
    expect(ctx.fillText).not.toHaveBeenCalled();
    fireEvent.click(buttons[0]);
    await screen.findByText('Page 1 / 2');
  });

  it('writes the annotations into the PDF at the clicked positions', async () => {
    const { container } = render(<EditPdf />);
    await load(container, 'doc.pdf');
    clickAt(75, 100);
    annotate('First');
    clickAt(30, 60);
    annotate('First');
    fireEvent.click(
      screen.getAllByRole('button').filter((b) => b.querySelector('[data-testid="NavigateNextIcon"]'))[0]
    );
    await screen.findByText('Page 2 / 2');
    clickAt(15, 150);
    annotate('Second');
    expect(screen.getByText('Annotations (3)')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[1]);
    expect(screen.getByText('Annotations (2)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download Edited PDF' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].name).toBe('edited-doc.pdf');
    expect(await pageCountOf(downloads[0].blob)).toBe(2);
    const runs = await drawnText(downloads[0].blob);
    expect(runs.map((r) => [r.text, r.x, r.y])).toEqual([
      ['First', 50, 133],
      ['Second', 10, 100],
    ]);
  });

  it('skips annotations on pages the PDF does not have', async () => {
    pdfjs.numPages = 3;
    const { container } = render(<EditPdf />);
    await load(container, 'short.pdf', 1);
    const next = screen.getAllByRole('button').filter((b) => b.querySelector('[data-testid="NavigateNextIcon"]'))[0];
    fireEvent.click(next);
    fireEvent.click(next);
    await screen.findByText('Page 3 / 3');
    clickAt(75, 100);
    annotate('Ghost');
    fireEvent.click(screen.getByRole('button', { name: 'Download Edited PDF' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(await pageCountOf(downloads[0].blob)).toBe(1);
    expect(await drawnText(downloads[0].blob)).toEqual([]);
  });

  it('reports a PDF it cannot write and replaces the file with Change PDF', async () => {
    const { container } = render(<EditPdf />);
    await load(container);
    clickAt(75, 100);
    annotate('Hello');
    vi.spyOn(PDFDocument.prototype, 'embedFont').mockRejectedValueOnce(new Error('no font'));
    fireEvent.click(screen.getByRole('button', { name: 'Download Edited PDF' }));
    expect(await screen.findByText('Failed to edit PDF.')).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    await closeAlert('Failed to edit PDF.');

    upload(container, pdfFile(await makePdf(2), 'other.pdf'));
    await waitFor(() => expect(screen.queryByText('"Hello" — page 1')).not.toBeInTheDocument());
    expect(screen.getByText('Click on the PDF preview to set position')).toBeInTheDocument();
  });
});
