import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  captureDownloads,
  dropOnZone,
  makeFile,
  makePdf,
  pageCountOf,
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

import MergePdf from '../../tools/merge-pdf';
import SplitPdf from '../../tools/split-pdf';
import RotatePdf from '../../tools/rotate-pdf';
import CropPdf from '../../tools/crop-pdf';
import OrganizePdf from '../../tools/organize-pdf';

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
const brokenPdf = () => makeFile('this is not a pdf', 'broken.pdf', 'application/pdf');
const pagesOf = async (blob: Blob) => (await PDFDocument.load(await readBytes(blob))).getPages();
/** A PDF that reads fine once (to count pages) and then fails with `reason`. */
function failsOnSecondRead(name: string, bytes: Uint8Array, reason: unknown) {
  const file = pdfFile(bytes, name);
  const read = file.arrayBuffer.bind(file);
  let reads = 0;
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => (++reads > 1 ? Promise.reject(reason) : read()),
  });
  return file;
}
const closeAlert = async (message: string) => {
  fireEvent.click(within(screen.getByText(message).closest('[role="alert"]') as HTMLElement).getByRole('button'));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
};
/** Closes the open message with Escape and waits until its Snackbar has left the DOM. */
const dismissWithEscape = async () => {
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(document.querySelector('.MuiSnackbar-root')).toBeNull());
};

describe('merge-pdf', () => {
  it('rejects anything that is not a PDF and closes the message', async () => {
    const { container } = render(<MergePdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select PDF files only.')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Please select PDF files only.')).not.toBeInTheDocument());
  });

  it('merges the listed files in the chosen order into one download', async () => {
    const { container } = render(<MergePdf />);
    expect(screen.getByText(/0 file\(s\) selected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
    upload(container, pdfFile(await makePdf(1, [100, 100]), 'one.pdf'));
    dropOnZone(pdfFile(await makePdf(2, [200, 200]), 'two.pdf'), /Drag & Drop PDFs/);
    expect(await screen.findByText('two.pdf')).toBeInTheDocument();
    expect(screen.getByText(/2 file\(s\) selected/)).toBeInTheDocument();
    expect(screen.getByTestId('preview')).toHaveTextContent('one.pdf');

    fireEvent.click(screen.getAllByTestId('ArrowDownwardIcon')[0]);
    expect(screen.getByTestId('preview')).toHaveTextContent('two.pdf');
    fireEvent.click(screen.getAllByTestId('ArrowUpwardIcon')[1]);
    expect(screen.getByTestId('preview')).toHaveTextContent('one.pdf');

    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Merged PDF' }));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toBe('merged.pdf');
    expect(await pageCountOf(downloads[0].blob)).toBe(3);
    const sizes = (await pagesOf(downloads[0].blob)).map((p) => p.getWidth());
    expect(sizes).toEqual([100, 200, 200]);
  });

  it('removes a file from the list and clears an earlier result when more are added', async () => {
    const { container } = render(<MergePdf />);
    upload(container, pdfFile(await makePdf(1), 'a.pdf'), pdfFile(await makePdf(1), 'b.pdf'));
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
    upload(container, pdfFile(await makePdf(1), 'c.pdf'));
    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    await screen.findByRole('button', { name: 'Download Merged PDF' });
    upload(container, pdfFile(await makePdf(1), 'd.pdf'));
    expect(screen.queryByRole('button', { name: 'Download Merged PDF' })).not.toBeInTheDocument();
  });

  it('reports a file it cannot merge and shows megabyte sizes', async () => {
    const { container } = render(<MergePdf />);
    const big = pdfFile(await makePdf(1), 'big.pdf');
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 });
    upload(container, big, brokenPdf());
    expect(screen.getByText('3.00 MB')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    expect(await screen.findByText('Failed to merge PDFs.')).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByText('Failed to merge PDFs.')).not.toBeInTheDocument());
  });
});

describe('split-pdf', () => {
  const load = async (pages: number, container: HTMLElement) => {
    upload(container, pdfFile(await makePdf(pages), 'book.pdf'));
    await screen.findByText('book.pdf');
  };

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<SplitPdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    upload(container, brokenPdf());
    expect(await screen.findByText('Could not read PDF.')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Could not read PDF.')).not.toBeInTheDocument());
  });

  it('splits every page into its own PDF and downloads one', async () => {
    const { container } = render(<SplitPdf />);
    dropOnZone(pdfFile(await makePdf(3), 'book.pdf'));
    await screen.findByText('book.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(await screen.findByText('page-3.pdf')).toBeInTheDocument();
    expect(screen.getByText('page-1.pdf')).toBeInTheDocument();
    fireEvent.click(within(screen.getByText('page-2.pdf').closest('li') as HTMLElement).getByRole('button'));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toBe('page-2.pdf');
    expect(await pageCountOf(downloads[0].blob)).toBe(1);
    upload(container, pdfFile(await makePdf(1), 'again.pdf'));
    await waitFor(() => expect(screen.queryByText('page-1.pdf')).not.toBeInTheDocument());
  });

  it('splits custom ranges and single pages', async () => {
    const { container } = render(<SplitPdf />);
    await load(5, container);
    fireEvent.click(screen.getByLabelText('Custom range'));
    fireEvent.change(screen.getByLabelText('Page ranges'), { target: { value: '1-3, 5, ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(await screen.findByText('pages-1-3.pdf')).toBeInTheDocument();
    expect(screen.getByText('page-5.pdf')).toBeInTheDocument();
    fireEvent.click(within(screen.getByText('pages-1-3.pdf').closest('li') as HTMLElement).getByRole('button'));
    expect(await pageCountOf(downloads[0].blob)).toBe(3);
  });

  it.each([
    ['0-2', 'Invalid range: 0-2'],
    ['2-9', 'Invalid range: 2-9'],
    ['4-2', 'Invalid range: 4-2'],
    ['a-b', 'Invalid range: a-b'],
    ['9', 'Invalid page: 9'],
    ['0', 'Invalid page: 0'],
    ['x', 'Invalid page: x'],
  ])('rejects the range %s', async (range, message) => {
    const { container } = render(<SplitPdf />);
    await load(3, container);
    fireEvent.click(screen.getByLabelText('Custom range'));
    fireEvent.change(screen.getByLabelText('Page ranges'), { target: { value: range } });
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('reports a failure that is not an Error with a generic message', async () => {
    const { container } = render(<SplitPdf />);
    upload(container, failsOnSecondRead('book.pdf', await makePdf(2), 'denied'));
    await screen.findByText('book.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(await screen.findByText('Split failed.')).toBeInTheDocument();
    await closeAlert('Split failed.');
  });

  it('shows megabyte sizes for large results', async () => {
    const { container } = render(<SplitPdf />);
    const big = pdfFile(await makePdf(1), 'big.pdf');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
    upload(container, big);
    expect(await screen.findByText(/2\.00 MB/)).toBeInTheDocument();
  });
});

describe('rotate-pdf', () => {
  const load = async (pages: number, container: HTMLElement) => {
    upload(container, pdfFile(await makePdf(pages), 'turn.pdf'));
    await screen.findByText('turn.pdf');
  };
  const rotate = () => fireEvent.click(screen.getByRole('button', { name: 'Rotate PDF' }));

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<RotatePdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    upload(container, brokenPdf());
    expect(await screen.findByText('Could not read PDF.')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Could not read PDF.')).not.toBeInTheDocument());
  });

  it('rotates every page by 90 degrees and names the download', async () => {
    const { container } = render(<RotatePdf />);
    dropOnZone(pdfFile(await makePdf(2), 'turn.pdf'));
    await screen.findByText('turn.pdf');
    rotate();
    fireEvent.click(await screen.findByRole('button', { name: 'Download Rotated PDF' }));
    expect(downloads[0].name).toBe('rotated-turn.pdf');
    const pages = await pagesOf(downloads[0].blob);
    expect(pages.map((p) => p.getRotation().angle)).toEqual([90, 90]);
    upload(container, pdfFile(await makePdf(1), 'again.pdf'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Download Rotated PDF' })).not.toBeInTheDocument());
  });

  it('adds the chosen angle only to the listed pages', async () => {
    const { container } = render(<RotatePdf />);
    await load(4, container);
    fireEvent.click(screen.getByRole('button', { name: '270°' }));
    fireEvent.click(screen.getByRole('button', { name: '270°' }));
    fireEvent.click(screen.getByLabelText('Specific pages'));
    fireEvent.change(screen.getByLabelText('Pages'), { target: { value: '1-2, 4, ' } });
    rotate();
    fireEvent.click(await screen.findByRole('button', { name: 'Download Rotated PDF' }));
    const pages = await pagesOf(downloads[0].blob);
    expect(pages.map((p) => p.getRotation().angle)).toEqual([270, 270, 0, 270]);
  });

  it('keeps an existing rotation and adds to it', async () => {
    const { container } = render(<RotatePdf />);
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]).setRotation(degrees(90));
    upload(container, pdfFile(await doc.save(), 'turn.pdf'));
    await screen.findByText('turn.pdf');
    fireEvent.click(screen.getByRole('button', { name: '180°' }));
    rotate();
    fireEvent.click(await screen.findByRole('button', { name: 'Download Rotated PDF' }));
    expect((await pagesOf(downloads[0].blob))[0].getRotation().angle).toBe(270);
  });

  it.each([
    ['0-2', 'Invalid range: 0-2'],
    ['2-9', 'Invalid range: 2-9'],
    ['3-1', 'Invalid range: 3-1'],
    ['a-b', 'Invalid range: a-b'],
    ['9', 'Invalid page: 9'],
    ['0', 'Invalid page: 0'],
    ['x', 'Invalid page: x'],
  ])('rejects the page list %s', async (pagesText, message) => {
    const { container } = render(<RotatePdf />);
    await load(3, container);
    fireEvent.click(screen.getByLabelText('Specific pages'));
    fireEvent.change(screen.getByLabelText('Pages'), { target: { value: pagesText } });
    rotate();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('reports a failure that is not an Error with a generic message', async () => {
    const { container } = render(<RotatePdf />);
    upload(container, failsOnSecondRead('turn.pdf', await makePdf(2), 'denied'));
    await screen.findByText('turn.pdf');
    rotate();
    expect(await screen.findByText('Rotation failed.')).toBeInTheDocument();
    await closeAlert('Rotation failed.');
  });

  it('shows megabyte sizes', async () => {
    const { container } = render(<RotatePdf />);
    const big = pdfFile(await makePdf(1), 'big.pdf');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
    upload(container, big);
    expect(await screen.findByText(/2\.00 MB/)).toBeInTheDocument();
  });
});

describe('crop-pdf', () => {
  const load = async (pages: number, container: HTMLElement) => {
    upload(container, pdfFile(await makePdf(pages, [200, 300]), 'trim.pdf'));
    await screen.findByText('trim.pdf');
  };
  const margin = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<CropPdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Failed to read PDF.')).not.toBeInTheDocument());
  });

  it('crops the margins of every page', async () => {
    const { container } = render(<CropPdf />);
    dropOnZone(pdfFile(await makePdf(2, [200, 300]), 'trim.pdf'));
    await screen.findByText('trim.pdf');
    margin('Top', '10');
    margin('Bottom', '20');
    margin('Left', '30');
    margin('Right', '40');
    fireEvent.click(screen.getByRole('button', { name: 'Crop PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Cropped PDF' }));
    expect(downloads[0].name).toBe('cropped-trim.pdf');
    const pages = await pagesOf(downloads[0].blob);
    pages.forEach((page) => expect(page.getCropBox()).toEqual({ x: 30, y: 20, width: 130, height: 270 }));
    upload(container, pdfFile(await makePdf(1), 'again.pdf'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Download Cropped PDF' })).not.toBeInTheDocument());
  });

  it('crops only the chosen page', async () => {
    const { container } = render(<CropPdf />);
    await load(3, container);
    margin('Left', '50');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Apply to' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Specific Page' }));
    margin('Page Number', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Crop PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Cropped PDF' }));
    const widths = (await pagesOf(downloads[0].blob)).map((p) => p.getCropBox().width);
    expect(widths).toEqual([200, 150, 200]);
  });

  it('reports a crop pdf-lib cannot apply', async () => {
    const { container } = render(<CropPdf />);
    const file = pdfFile(await makePdf(1), 'trim.pdf');
    const read = file.arrayBuffer.bind(file);
    let reads = 0;
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => (++reads > 1 ? Promise.reject(new Error('gone')) : read()),
    });
    upload(container, file);
    await screen.findByText('trim.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Crop PDF' }));
    expect(await screen.findByText('Failed to crop PDF.')).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    await closeAlert('Failed to crop PDF.');
  });

  it('shows megabyte sizes', async () => {
    const { container } = render(<CropPdf />);
    const big = pdfFile(await makePdf(1), 'big.pdf');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
    upload(container, big);
    expect(await screen.findByText(/2\.00 MB/)).toBeInTheDocument();
  });
});

describe('organize-pdf', () => {
  const load = async (pages: number, container: HTMLElement) => {
    upload(container, pdfFile(await makePdf(pages, [200, 300]), 'order.pdf'));
    await screen.findByText('Page 1 (original: 1)');
  };

  it('rejects non-PDF files and PDFs it cannot read', async () => {
    const { container } = render(<OrganizePdf />);
    upload(container, textFile());
    expect(await screen.findByText('Please select a PDF file.')).toBeInTheDocument();
    upload(container, brokenPdf());
    expect(await screen.findByText('Failed to read PDF.')).toBeInTheDocument();
    await dismissWithEscape();
    await waitFor(() => expect(screen.queryByText('Failed to read PDF.')).not.toBeInTheDocument());
  });

  it('lists page sizes, reorders and drops pages, then writes the new order', async () => {
    render(<OrganizePdf />);
    expect(screen.getByRole('button', { name: 'Reorganize PDF' })).toBeDisabled();
    const doc = await PDFDocument.create();
    doc.addPage([100, 110]);
    doc.addPage([200, 210]);
    doc.addPage([300, 310]);
    dropOnZone(pdfFile(await doc.save(), 'order.pdf'));
    await screen.findByText('Page 3 (original: 3)');
    expect(screen.getAllByText('200 x 210 pts')).toHaveLength(1);
    expect(screen.getByTestId('preview')).toHaveTextContent('order.pdf');

    fireEvent.click(screen.getAllByTestId('ArrowDownwardIcon')[0]);
    expect(screen.getByText('Page 1 (original: 2)')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('ArrowUpwardIcon')[2]);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);
    expect(screen.getByText('Page 2 (original: 1)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reorganize PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download Organized PDF' }));
    expect(downloads[0].name).toBe('organized-order.pdf');
    const widths = (await pagesOf(downloads[0].blob)).map((p) => p.getWidth());
    expect(widths).toEqual([300, 100]);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);
    expect(screen.queryByRole('button', { name: 'Download Organized PDF' })).not.toBeInTheDocument();
  });

  it('reports a reorganisation that fails', async () => {
    const { container } = render(<OrganizePdf />);
    await load(2, container);
    vi.spyOn(PDFDocument.prototype, 'copyPages').mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByRole('button', { name: 'Reorganize PDF' }));
    expect(await screen.findByText('Failed to reorganize PDF.')).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    await closeAlert('Failed to reorganize PDF.');
  });

  it('shows megabyte sizes', async () => {
    const { container } = render(<OrganizePdf />);
    const big = pdfFile(await makePdf(1), 'big.pdf');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
    upload(container, big);
    expect(await screen.findByText(/2\.00 MB/)).toBeInTheDocument();
  });
});
