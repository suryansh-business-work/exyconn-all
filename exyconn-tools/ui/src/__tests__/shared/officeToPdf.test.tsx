/**
 * The shared "<format> to PDF" page: picking or dropping a file, the size it reports, the
 * server round trip and the download of the converted PDF.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import OfficeToPdf from '../../shared/components/OfficeToPdf';
import { NETWORK_ERROR_MESSAGE, downloadBlob, formatSize } from '../../shared/components/OfficeToPdf/utils';
import { captureDownloads } from '../helpers/pdfHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

const renderPage = () =>
  render(
    <OfficeToPdf
      toolName="Sheet to PDF"
      icon={<span />}
      color="#000000"
      hoverColor="#111111"
      accept=".sheet"
      isAcceptedFile={(name) => name.endsWith('.sheet')}
      invalidFileMessage="Pick a .sheet file."
      dropTitle="Drop a sheet"
      supportedFormats="Supports .sheet"
      emptyHint="Nothing yet"
    />
  );

const zone = () => screen.getByText('Drop a sheet').closest('.MuiPaper-root') as HTMLElement;
const sheet = (name = 'budget.sheet', bytes = 2048) => new File([new Uint8Array(bytes)], name);

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('office-to-pdf utils', () => {
  it('formats sizes in KB below a megabyte and in MB from there', () => {
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(1024 * 1024 - 1)).toBe('1024.0 KB');
    expect(formatSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatSize(5.5 * 1024 * 1024)).toBe('5.50 MB');
  });

  it('downloads a blob under the given name and releases its URL', () => {
    const downloads = captureDownloads();
    const blob = new Blob(['%PDF']);
    downloadBlob(blob, 'out.pdf');
    expect(downloads).toEqual([{ name: 'out.pdf', blob }]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:captured-1');
  });
});

describe('OfficeToPdf drop zone', () => {
  it('highlights while dragging and loads a dropped file, ignoring an empty drop', () => {
    renderPage();
    fireEvent.dragOver(zone());
    fireEvent.dragLeave(zone());
    fireEvent.drop(zone(), { dataTransfer: { files: [] } });
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();

    fireEvent.drop(zone(), { dataTransfer: { files: [sheet('big.sheet', 3 * 1024 * 1024)] } });
    expect(screen.getByText('big.sheet')).toBeInTheDocument();
    expect(screen.getByText('3.00 MB')).toBeInTheDocument();
  });

  it('ignores a picker closed without a file', () => {
    const { container } = renderPage();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('refuses a file of another format until the message is dismissed', async () => {
    renderPage();
    fireEvent.drop(zone(), { dataTransfer: { files: [sheet('photo.png')] } });
    expect(screen.getByText('Pick a .sheet file.')).toBeInTheDocument();
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(screen.queryByText('Pick a .sheet file.')).not.toBeInTheDocument();
  });
});

describe('OfficeToPdf conversion', () => {
  it('reports an unreachable server and lets the user try again', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderPage();
    fireEvent.drop(zone(), { dataTransfer: { files: [sheet()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert to PDF' })).toBeEnabled();
  });

  it('downloads the converted PDF under the document name', async () => {
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => pdf });
    const downloads = captureDownloads();
    renderPage();
    const file = sheet();
    fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Download budget.pdf' }));
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBeInstanceOf(FormData);
    expect(downloads).toEqual([{ name: 'budget.pdf', blob: pdf }]);
    expect(screen.getByText(/budget\.pdf \(0\.0 KB\) is ready to download/)).toBeInTheDocument();
  });
});
