import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { isAcceptedFile, pdfFileName, readErrorMessage, SERVICE_UNAVAILABLE_MESSAGE } from './utils';
import { APIs } from '../../shared/config/apis';
import ExcelToPdf from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const selectFile = (name: string): File => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['excel-bytes'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
};

describe('excel-to-pdf utils', () => {
  describe('isAcceptedFile', () => {
    it('accepts .xlsx', () => expect(isAcceptedFile('sheet.xlsx')).toBe(true));
    it('accepts .xls regardless of case', () => expect(isAcceptedFile('Sheet.XLS')).toBe(true));
    it('rejects other extensions', () => expect(isAcceptedFile('sheet.csv')).toBe(false));
    it('rejects names without an extension', () => expect(isAcceptedFile('sheet')).toBe(false));
  });

  describe('pdfFileName', () => {
    it('swaps the extension for .pdf', () => expect(pdfFileName('sheet.xlsx')).toBe('sheet.pdf'));
    it('keeps earlier dots in the name', () => expect(pdfFileName('q1.sheet.xls')).toBe('q1.sheet.pdf'));
    it('appends .pdf when there is no extension', () => expect(pdfFileName('sheet')).toBe('sheet.pdf'));
  });

  describe('readErrorMessage', () => {
    it('uses the server error field', async () => {
      const res = { status: 400, json: async () => ({ error: 'Bad file' }) };
      await expect(readErrorMessage(res)).resolves.toBe('Bad file');
    });
    it('falls back to a generic message for non-JSON bodies', async () => {
      const res = { status: 500, json: async () => { throw new Error('not json'); } };
      await expect(readErrorMessage(res)).resolves.toBe('Conversion failed (HTTP 500).');
    });
  });
});

describe('ExcelToPdf component', () => {
  it('renders the upload zone', () => {
    render(<ExcelToPdf />);
    expect(screen.getByText('Excel to PDF')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Excel File Here')).toBeInTheDocument();
    expect(screen.getByText('Upload an Excel spreadsheet to get started')).toBeInTheDocument();
  });

  it('rejects a non-Excel file', () => {
    render(<ExcelToPdf />);
    selectFile('image.png');
    expect(screen.getByText('Please select an Excel file (.xls or .xlsx).')).toBeInTheDocument();
  });

  it('converts on the server and offers the PDF download', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }),
    });
    render(<ExcelToPdf />);
    const file = selectFile('sheet.xlsx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Download sheet.pdf' })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(APIs.officeTools.officeToPdf);
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
  });

  it('shows progress while the server converts', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock.mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
    render(<ExcelToPdf />);
    selectFile('sheet.xlsx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText('Converting on Exyconn server…')).toBeInTheDocument();
    resolveFetch({ ok: true, status: 200, blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }) });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download sheet.pdf' })).toBeInTheDocument());
  });

  it('shows a friendly message when the service is unavailable (503)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    render(<ExcelToPdf />);
    selectFile('sheet.xlsx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText(SERVICE_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert to PDF' })).toBeEnabled();
  });

  it('surfaces the server error message on other failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'File is corrupted' }) });
    render(<ExcelToPdf />);
    selectFile('sheet.xlsx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText('File is corrupted')).toBeInTheDocument();
  });
});
