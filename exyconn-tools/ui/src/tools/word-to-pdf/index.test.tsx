import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { isAcceptedFile, pdfFileName, readErrorMessage, SERVICE_UNAVAILABLE_MESSAGE } from './utils';
import { APIs } from '../../shared/config/apis';
import WordToPdf from './index';

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
  const file = new File(['word-bytes'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
};

describe('word-to-pdf utils', () => {
  describe('isAcceptedFile', () => {
    it('accepts .docx', () => expect(isAcceptedFile('report.docx')).toBe(true));
    it('accepts .doc regardless of case', () => expect(isAcceptedFile('Report.DOC')).toBe(true));
    it('rejects other extensions', () => expect(isAcceptedFile('report.pdf')).toBe(false));
    it('rejects names without an extension', () => expect(isAcceptedFile('report')).toBe(false));
  });

  describe('pdfFileName', () => {
    it('swaps the extension for .pdf', () => expect(pdfFileName('report.docx')).toBe('report.pdf'));
    it('keeps earlier dots in the name', () => expect(pdfFileName('q1.report.doc')).toBe('q1.report.pdf'));
    it('appends .pdf when there is no extension', () => expect(pdfFileName('report')).toBe('report.pdf'));
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

describe('WordToPdf component', () => {
  it('renders the upload zone', () => {
    render(<WordToPdf />);
    expect(screen.getByText('Word to PDF')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Word File Here')).toBeInTheDocument();
    expect(screen.getByText('Upload a Word document to get started')).toBeInTheDocument();
  });

  it('rejects a non-Word file', () => {
    render(<WordToPdf />);
    selectFile('image.png');
    expect(screen.getByText('Please select a Word document (.doc or .docx).')).toBeInTheDocument();
  });

  it('converts on the server and offers the PDF download', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }),
    });
    render(<WordToPdf />);
    const file = selectFile('report.docx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument());
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
    render(<WordToPdf />);
    selectFile('report.docx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText('Converting on Exyconn server…')).toBeInTheDocument();
    resolveFetch({ ok: true, status: 200, blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }) });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument());
  });

  it('shows a friendly message when the service is unavailable (503)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    render(<WordToPdf />);
    selectFile('report.docx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText(SERVICE_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert to PDF' })).toBeEnabled();
  });

  it('surfaces the server error message on other failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'File is corrupted' }) });
    render(<WordToPdf />);
    selectFile('report.docx');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));

    expect(await screen.findByText('File is corrupted')).toBeInTheDocument();
  });
});
