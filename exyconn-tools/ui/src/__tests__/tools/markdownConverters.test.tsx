import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import CsvToMarkdown from '../../tools/csv-to-markdown';
import DocxToMarkdown from '../../tools/docx-to-markdown';
import GoogleDocsToMarkdown from '../../tools/google-docs-to-markdown';
import HtmlToMarkdown from '../../tools/html-to-markdown';
import JsonToMarkdown from '../../tools/json-to-markdown';
import NotionToMarkdown from '../../tools/notion-to-markdown';
import PdfToMarkdown from '../../tools/pdf-to-markdown';
import RtfToMarkdown from '../../tools/rtf-to-markdown';
import TextToMarkdown from '../../tools/text-to-markdown';
import WebpageToMarkdown from '../../tools/webpage-to-markdown';
import XmlToMarkdown from '../../tools/xml-to-markdown';

const MD = '# Converted\n\nbody';
const converted = (extra: Record<string, unknown> = {}) =>
  jsonReply({ success: true, data: { markdown: MD, ...extra } });

let clipboardWrite: ReturnType<typeof vi.fn>;
let anchorClick: ReturnType<typeof vi.spyOn>;
let downloaded: string[];

beforeEach(() => {
  clipboardWrite = vi.fn();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardWrite }, configurable: true });
  downloaded = [];
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const element = create(tag);
    if (tag === 'a') {
      Object.defineProperty(element, 'download', {
        set: (value: string) => downloaded.push(value),
        get: () => downloaded.at(-1) ?? '',
      });
    }
    return element;
  });
  anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const typeContent = (value: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value } });
const textFile = (name: string, body: string) => {
  const file = new File([body], name);
  Object.defineProperty(file, 'text', { value: async () => body });
  return file;
};
const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;

interface TextCase {
  name: string;
  Tool: React.ComponentType;
  button: string;
  upload: string;
  filename: string;
  sample: string;
}

const TEXT_CASES: TextCase[] = [
  {
    name: 'csv-to-markdown',
    Tool: CsvToMarkdown,
    button: 'Convert to Markdown Table',
    upload: 'Upload CSV',
    filename: 'table.md',
    sample: 'a,b\n1,2',
  },
  {
    name: 'json-to-markdown',
    Tool: JsonToMarkdown,
    button: 'Convert to Markdown',
    upload: 'Upload',
    filename: 'data.md',
    sample: '{"a":1}',
  },
  {
    name: 'html-to-markdown',
    Tool: HtmlToMarkdown,
    button: 'Convert to Markdown',
    upload: 'Upload HTML',
    filename: 'converted.md',
    sample: '<h1>Hi</h1>',
  },
  {
    name: 'rtf-to-markdown',
    Tool: RtfToMarkdown,
    button: 'Convert to Markdown',
    upload: 'Upload RTF',
    filename: 'converted.md',
    sample: '{\\rtf1 Hi}',
  },
  {
    name: 'xml-to-markdown',
    Tool: XmlToMarkdown,
    button: 'Convert to Markdown',
    upload: 'Upload XML',
    filename: 'converted.md',
    sample: '<a>b</a>',
  },
  {
    name: 'text-to-markdown',
    Tool: TextToMarkdown,
    button: 'Convert to Markdown',
    upload: 'Upload TXT',
    filename: 'converted.md',
    sample: 'HELLO',
  },
];

describe.each(TEXT_CASES)('$name', ({ Tool, button, upload, filename, sample }) => {
  it('keeps the button disabled until there is content', () => {
    renderTool(Tool);

    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    typeContent('   ');
    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    typeContent(sample);
    expect(screen.getByRole('button', { name: button })).toBeEnabled();
  });

  it('posts the content, shows the markdown, copies it and downloads it', async () => {
    const fetchMock = stubFetch(converted());
    renderTool(Tool);

    typeContent(sample);
    fireEvent.click(screen.getByRole('button', { name: button }));

    expect(await screen.findByText(/# Converted/)).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body)).content).toBe(sample);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(clipboardWrite).toHaveBeenCalledWith(MD);
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(downloaded).toEqual([filename]);
  });

  it('shows the server error, or its own message when there is none', async () => {
    stubFetch(jsonReply({ success: false, error: 'Bad input' }, { ok: false, status: 400 }));
    renderTool(Tool);
    typeContent(sample);
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(await findAlert('Bad input')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Bad input')).not.toBeInTheDocument());

    stubFetch(jsonReply({ success: false }, { ok: false, status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(await findAlert('Conversion failed')).toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => expect(screen.getByText('Conversion failed')).toBeInTheDocument());
  });

  it('treats an answer without markdown as empty output', async () => {
    stubFetch(jsonReply({ success: true }));
    renderTool(Tool);

    typeContent(sample);
    fireEvent.click(screen.getByRole('button', { name: button }));

    await waitFor(() => expect(screen.getByRole('button', { name: button })).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('fills the box from an uploaded file', async () => {
    const { container } = renderTool(Tool);

    expect(screen.getByText(upload)).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(fileInput(container), { target: { files: [textFile('in.txt', sample)] } });
    });

    await waitFor(() => expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(sample));
    await act(async () => {
      fireEvent.change(fileInput(container), { target: { files: [] } });
    });
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(sample);
  });

  it('clears the copied notice by itself', async () => {
    stubFetch(converted());
    renderTool(Tool);
    typeContent(sample);
    fireEvent.click(screen.getByRole('button', { name: button }));
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.click(document.body);
    });

    await waitFor(() => expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument());
  });

  it('shows the loading state while converting', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    renderTool(Tool);
    typeContent(sample);

    fireEvent.click(screen.getByRole('button', { name: button }));

    expect(await screen.findByRole('button', { name: 'Converting...' })).toBeDisabled();
    await act(async () => finish(converted()));
  });
});

describe('csv-to-markdown options', () => {
  it('sends whether the first row is a header', async () => {
    const fetchMock = stubFetch(converted());
    renderTool(CsvToMarkdown);

    typeContent('a,b');
    fireEvent.click(screen.getByLabelText('First row is header'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown Table' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ content: 'a,b', hasHeader: false });
  });
});

describe('json-to-markdown validation', () => {
  it('refuses invalid JSON without calling the server', async () => {
    const fetchMock = stubFetch();
    renderTool(JsonToMarkdown);

    typeContent('{oops');
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));

    expect(await findAlert('Invalid JSON format')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('formats valid JSON in place, and says so when it cannot', async () => {
    renderTool(JsonToMarkdown);

    typeContent('{"a":1}');
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('{\n  "a": 1\n}');

    typeContent('{oops');
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(await findAlert('Cannot format invalid JSON')).toBeInTheDocument();
  });
});

describe('text-to-markdown options', () => {
  it('sends the detection switches, each of which can be turned off', async () => {
    const fetchMock = stubFetch(converted());
    renderTool(TextToMarkdown);

    typeContent('TEXT');
    for (const name of ['Headings', 'Lists', 'Links', 'Code Blocks']) {
      fireEvent.click(screen.getByRole('checkbox', { name }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).options).toEqual({
      detectHeadings: false,
      detectLists: false,
      detectLinks: false,
      detectCodeBlocks: false,
    });
  });
});

interface UrlCase {
  name: string;
  Tool: React.ComponentType;
  button: string;
  url: string;
  empty: string;
  invalid?: [string, string];
  untitled: string;
  titled: [string, string];
}

const URL_CASES: UrlCase[] = [
  {
    name: 'notion-to-markdown',
    Tool: NotionToMarkdown,
    button: 'Convert Notion Page',
    url: 'https://www.notion.so/page-1',
    empty: 'Please enter a Notion page URL',
    invalid: ['https://example.org/x', 'Please enter a valid Notion page URL'],
    untitled: 'notion-page.md',
    titled: ['My Page: 1', 'my-page--1.md'],
  },
  {
    name: 'google-docs-to-markdown',
    Tool: GoogleDocsToMarkdown,
    button: 'Convert Google Doc',
    url: 'https://docs.google.com/document/d/abc/edit',
    empty: 'Please enter a Google Docs URL',
    invalid: ['https://example.org/x', 'Please enter a valid Google Docs URL'],
    untitled: 'google-doc.md',
    titled: ['Plan 2026', 'plan-2026.md'],
  },
  {
    name: 'webpage-to-markdown',
    Tool: WebpageToMarkdown,
    button: expect.stringMatching(/Convert/) as unknown as string,
    url: 'https://example.org/article',
    empty: 'Please enter a URL',
    untitled: 'webpage.md',
    titled: ['An Article!', 'an-article-.md'],
  },
];

describe.each(URL_CASES)('$name', ({ Tool, url, empty, invalid, untitled, titled }) => {
  const urlBox = () => screen.getByRole('textbox');
  const convertButton = () =>
    screen.getAllByRole('button').find((b) => /convert|fetch/i.test(b.textContent ?? '')) as HTMLElement;

  it('converts a page, names the download after its title, and falls back to a default name', async () => {
    const fetchMock = stubFetch(converted({ title: titled[0] }), converted());
    renderTool(Tool);

    fireEvent.change(urlBox(), { target: { value: url } });
    fireEvent.click(convertButton());
    expect(await screen.findByText(titled[0])).toBeInTheDocument();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ url });
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloaded.at(-1)).toBe(titled[1]);

    fireEvent.click(convertButton());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(titled[0])).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloaded.at(-1)).toBe(untitled);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(clipboardWrite).toHaveBeenCalledWith(MD);
  });

  it('converts when Enter is pressed, and asks for a URL when there is none', async () => {
    const fetchMock = stubFetch(converted());
    renderTool(Tool);

    fireEvent.keyDown(urlBox(), { key: 'Enter' });
    expect(await findAlert(empty)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(urlBox(), { target: { value: url } });
    fireEvent.keyDown(urlBox(), { key: 'a' });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyDown(urlBox(), { key: 'Enter' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('shows the server error and its own fallback', async () => {
    stubFetch(jsonReply({ success: false, error: 'Page not reachable' }, { ok: false, status: 502 }));
    renderTool(Tool);
    fireEvent.change(urlBox(), { target: { value: url } });
    fireEvent.click(convertButton());
    expect(await findAlert('Page not reachable')).toBeInTheDocument();

    stubFetch(jsonReply({ success: false }, { ok: false, status: 500 }));
    fireEvent.click(convertButton());
    expect(await findAlert('Conversion failed')).toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(convertButton());
    await waitFor(() => expect(screen.getByText('Conversion failed')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  });

  it('clears the copied notice by itself', async () => {
    stubFetch(converted());
    renderTool(Tool);
    fireEvent.change(urlBox(), { target: { value: url } });
    fireEvent.click(convertButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.click(document.body);
    });

    await waitFor(() => expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument());
  });

  it('refuses a link that is not for this service', async () => {
    if (!invalid) return;
    const fetchMock = stubFetch();
    renderTool(Tool);

    fireEvent.change(urlBox(), { target: { value: invalid[0] } });
    fireEvent.click(convertButton());

    expect(await findAlert(invalid[1])).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the loading state and an empty answer', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    renderTool(Tool);
    fireEvent.change(urlBox(), { target: { value: url } });

    fireEvent.click(convertButton());

    expect(await screen.findByRole('button', { name: /Fetching|Converting/ })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: true })));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument());
  });
});

interface FileCase {
  name: string;
  Tool: React.ComponentType;
  accepts: (name: string) => File;
  rejects: File;
  rejection: string;
  downloadFrom: [string, string];
}

const FILE_CASES: FileCase[] = [
  {
    name: 'docx-to-markdown',
    Tool: DocxToMarkdown,
    accepts: (name) =>
      new File(['d'], name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    rejects: new File(['x'], 'a.txt', { type: 'text/plain' }),
    rejection: 'Please drop a DOCX file',
    downloadFrom: ['report.docx', 'report.md'],
  },
  {
    name: 'pdf-to-markdown',
    Tool: PdfToMarkdown,
    accepts: (name) => new File(['p'], name, { type: 'application/pdf' }),
    rejects: new File(['x'], 'a.txt', { type: 'text/plain' }),
    rejection: 'Please drop a PDF file',
    downloadFrom: ['report.pdf', 'report.md'],
  },
];

describe.each(FILE_CASES)('$name', ({ Tool, accepts, rejects, rejection, downloadFrom }) => {
  const drop = (zone: Element, file: File) => fireEvent.drop(zone, { dataTransfer: { files: [file] } });
  const zoneOf = () =>
    screen.getByText(/Drop .* here or click to upload/).closest('div[class*="MuiBox"], div') as HTMLElement;

  it('converts a chosen file and downloads it under the same name with .md', async () => {
    const fetchMock = stubFetch(converted());
    const { container } = renderTool(Tool);
    const convert = screen.getByRole('button', { name: 'Convert to Markdown' });
    expect(convert).toBeDisabled();

    fireEvent.change(fileInput(container), { target: { files: [accepts(downloadFrom[0])] } });
    expect((await screen.findAllByText(downloadFrom[0])).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));

    expect(await screen.findByText(/# Converted/)).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloaded.at(-1)).toBe(downloadFrom[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(clipboardWrite).toHaveBeenCalledWith(MD);
  });

  it('accepts a dropped file of the right kind and refuses another', async () => {
    const { container } = renderTool(Tool);
    const zone = zoneOf();

    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    drop(zone, rejects);
    expect(await findAlert(rejection)).toBeInTheDocument();

    drop(zone, accepts(downloadFrom[0]));
    expect((await screen.findAllByText(downloadFrom[0])).length).toBeGreaterThan(0);
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
  });

  it('opens the file picker when the zone is clicked', () => {
    renderTool(Tool);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    fireEvent.click(zoneOf());

    expect(click).toHaveBeenCalled();
  });

  it('removes the chosen file, and reports server errors', async () => {
    stubFetch(jsonReply({ success: false, error: 'Corrupt file' }, { ok: false, status: 400 }));
    const { container } = renderTool(Tool);
    fireEvent.change(fileInput(container), { target: { files: [accepts(downloadFrom[0])] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Convert to Markdown' }));
    expect(await findAlert('Corrupt file')).toBeInTheDocument();

    stubFetch(jsonReply({ success: false }, { ok: false, status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));
    await waitFor(() => expect(screen.getByText('Conversion failed')).toBeInTheDocument());
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));
    await waitFor(() => expect(screen.getByText('Conversion failed')).toBeInTheDocument());

    const remove = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg[data-testid*="Close"], svg[data-testid*="Delete"]'));
    fireEvent.click(remove as HTMLElement);
    await waitFor(() => expect(screen.queryAllByText(downloadFrom[0])).toHaveLength(0));
  });

  it('shows the loading state, and no markdown for an empty answer', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    const { container } = renderTool(Tool);
    fireEvent.change(fileInput(container), { target: { files: [accepts(downloadFrom[0])] } });

    fireEvent.click(await screen.findByRole('button', { name: 'Convert to Markdown' }));

    expect(await screen.findByRole('button', { name: 'Converting...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: true })));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Convert to Markdown' })).toBeEnabled());
  });

  it('downloads as converted.md once the file has been removed', async () => {
    stubFetch(converted());
    const { container } = renderTool(Tool);
    fireEvent.change(fileInput(container), { target: { files: [accepts(downloadFrom[0])] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Convert to Markdown' }));
    await screen.findByText(/# Converted/);

    const remove = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg[data-testid*="Close"], svg[data-testid*="Delete"]'));
    fireEvent.click(remove as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloaded.at(-1)).toBe('converted.md');
  });

  it('closes the error and clears the copied notice', async () => {
    stubFetch(jsonReply({ success: false, error: 'Corrupt file' }, { ok: false, status: 400 }), converted());
    const { container } = renderTool(Tool);
    fireEvent.change(fileInput(container), { target: { files: [accepts(downloadFrom[0])] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Convert to Markdown' }));
    expect(await findAlert('Corrupt file')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Corrupt file')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Convert to Markdown' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.click(document.body);
    });
    await waitFor(() => expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument());
  });
});
