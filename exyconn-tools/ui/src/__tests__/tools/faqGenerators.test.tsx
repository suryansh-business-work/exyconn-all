import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/services/openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/services/openai')>();
  return { ...actual, generateWithOpenAI: vi.fn() };
});

import { OpenAIRequestError, generateWithOpenAI } from '../../shared/services/openai';
import DocxFaqGenerator from '../../tools/docx-faq-generator';
import GoogleDocsFaqGenerator from '../../tools/google-docs-faq-generator';
import HtmlFaqGenerator from '../../tools/html-faq-generator';
import NotionFaqGenerator from '../../tools/notion-faq-generator';
import PdfFaqGenerator from '../../tools/pdf-faq-generator';
import WebpageFaqGenerator from '../../tools/webpage-faq-generator';
import WebsiteFaqGenerator from '../../tools/website-faq-generator';

const generate = vi.mocked(generateWithOpenAI);
const USAGE = { promptTokens: 1, completionTokens: 2, totalTokens: 3 };

beforeEach(() => {
  generate.mockReset();
  localStorage.clear();
  localStorage.setItem('openai_api_key', 'sk-faq-0123456789');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

interface Case {
  name: string;
  Tool: React.ComponentType;
  /** Gives the tool its source; returns what the converter request should look like. */
  provide: (container: HTMLElement) => void;
  generateButton?: string;
  /** The text the converter answers with, as the tool reads it. */
  converted: (content: string) => unknown;
  sourceFailure: string;
  emptyMessage: string;
  promptStart: string;
}

const file = (name: string, type: string) => new File(['body'], name, { type });
const uploadTo = (container: HTMLElement, chosen: File) =>
  fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [chosen] } });

const CASES: Case[] = [
  {
    name: 'docx-faq-generator',
    Tool: DocxFaqGenerator,
    provide: (c) =>
      uploadTo(c, file('guide.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
    converted: (markdown) => ({ data: { markdown } }),
    sourceFailure: 'Failed to extract DOCX content',
    emptyMessage: 'No content found in the document',
    promptStart: 'Generate 10 FAQs in a professional tone based on this document:',
  },
  {
    name: 'pdf-faq-generator',
    Tool: PdfFaqGenerator,
    provide: (c) => uploadTo(c, file('guide.pdf', 'application/pdf')),
    converted: (markdown) => ({ data: { markdown } }),
    sourceFailure: 'Failed to extract PDF content',
    emptyMessage: 'No content found in the PDF',
    promptStart: 'Generate 10 FAQs in a professional tone based on this PDF content:',
  },
  {
    name: 'google-docs-faq-generator',
    Tool: GoogleDocsFaqGenerator,
    provide: () =>
      fireEvent.change(screen.getByLabelText('Google Docs URL'), {
        target: { value: 'https://docs.google.com/document/d/abc/edit' },
      }),
    converted: (markdown) => ({ data: { markdown } }),
    sourceFailure: 'Failed to fetch Google Doc',
    emptyMessage: 'No content found in the document',
    promptStart: 'Generate 10 FAQs in a professional tone based on this Google Docs content:',
  },
  {
    name: 'notion-faq-generator',
    Tool: NotionFaqGenerator,
    provide: () =>
      fireEvent.change(screen.getByLabelText('Notion Public URL'), { target: { value: 'https://notion.so/page' } }),
    converted: (markdown) => ({ data: { markdown } }),
    sourceFailure: 'Failed to fetch Notion page',
    emptyMessage: 'No content found in the Notion page',
    promptStart: 'Generate 10 FAQs in a professional tone based on this Notion page content:',
  },
  {
    name: 'webpage-faq-generator',
    Tool: WebpageFaqGenerator,
    provide: () =>
      fireEvent.change(screen.getByLabelText('Webpage URL'), { target: { value: 'https://example.org/about' } }),
    converted: (markdown) => ({ data: { markdown } }),
    sourceFailure: 'Failed to fetch webpage',
    emptyMessage: 'No content found on the webpage',
    promptStart: 'Generate 10 FAQs in a professional tone based on this webpage content:',
  },
];

describe.each(CASES)('$name', ({ Tool, provide, converted, sourceFailure, emptyMessage, promptStart }) => {
  const button = () => screen.getByRole('button', { name: 'Generate FAQs' });

  it('keeps the button disabled until there is a source', () => {
    renderTool(Tool);

    expect(button()).toBeDisabled();
  });

  it('converts the source, then asks OpenAI for FAQs and shows them', async () => {
    const fetchMock = stubFetch(jsonReply(converted('# Guide\n\nHow to reset a password.')));
    generate.mockResolvedValue({ content: '1. Q? A.', usage: USAGE });
    const { container } = renderTool(Tool);

    provide(container);
    fireEvent.click(button());

    expect(await screen.findByText('1. Q? A.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [key, , prompt] = generate.mock.calls[0];
    expect(key).toBe('sk-faq-0123456789');
    expect(prompt).toContain(promptStart);
    expect(prompt).toContain('How to reset a password.');
  });

  it('uses the chosen number of FAQs and tone', async () => {
    stubFetch(jsonReply(converted('Some content')));
    generate.mockResolvedValue({ content: 'Out', usage: USAGE });
    const { container } = renderTool(Tool);
    provide(container);

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: '20 FAQs' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Technical' }));
    fireEvent.click(button());

    await waitFor(() => expect(generate).toHaveBeenCalled());
    expect(generate.mock.calls[0][2]).toContain('Generate 20 FAQs in a technical tone');
  });

  it('shows the converter failing, an empty document, and its own fallbacks', async () => {
    stubFetch(jsonReply({ error: 'Cannot read it' }, { ok: false, status: 400 }));
    const { container } = renderTool(Tool);
    provide(container);
    fireEvent.click(button());
    expect(await findAlert('Cannot read it')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    fireEvent.click(button());
    expect(await findAlert(sourceFailure)).toBeInTheDocument();
    await clickAway();

    stubFetch(jsonReply(converted('')));
    fireEvent.click(button());
    expect(await findAlert(emptyMessage)).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(button());
    expect(await findAlert('Failed to generate FAQs')).toBeInTheDocument();
  });

  it('asks for a key when there is none, and when OpenAI rejects it', async () => {
    localStorage.clear();
    const fetchMock = stubFetch(jsonReply(converted('Some content')));
    const { container } = renderTool(Tool);
    provide(container);

    fireEvent.click(button());
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    localStorage.setItem('openai_api_key', 'sk-late-0123456789');
    stubFetch(jsonReply(converted('Some content')));
    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 401));
    fireEvent.click(button());
    await waitFor(() => expect(generate).toHaveBeenCalled());
    expect(await screen.findByText('Bad key')).toBeInTheDocument();
  });

  it('shows the working state', async () => {
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
    provide(container);

    fireEvent.click(button());

    expect(await screen.findByRole('button', { name: 'Generating FAQs...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('file based FAQ generators', () => {
  it.each([
    ['docx-faq-generator', DocxFaqGenerator, 'Please upload a valid DOCX file'],
    ['pdf-faq-generator', PdfFaqGenerator, 'Please upload a valid PDF file'],
  ])('%s refuses a picker that returns nothing or the wrong type', async (_id, Tool, message) => {
    const { container } = renderTool(Tool);

    uploadTo(container, file('notes.txt', 'text/plain'));

    if (message.includes('PDF')) {
      expect(await findAlert(message)).toBeInTheDocument();
    }
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [] } });
    expect(await findAlert(message)).toBeInTheDocument();
  });

  it('shows the chosen file name', () => {
    const { container } = renderTool(PdfFaqGenerator);

    uploadTo(container, file('guide.pdf', 'application/pdf'));

    expect(screen.getByText('guide.pdf')).toBeInTheDocument();
  });
});

describe('html-faq-generator', () => {
  const html = '<h1>Hello</h1><p>World</p>';

  it('generates from pasted HTML, using the converted markdown', async () => {
    stubFetch(jsonReply({ data: { markdown: '# Hello' } }));
    generate.mockResolvedValue({ content: 'FAQ output', usage: USAGE });
    renderTool(HtmlFaqGenerator);
    const button = screen.getByRole('button', { name: 'Generate FAQs' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Or Paste HTML'), { target: { value: html } });
    fireEvent.click(button);

    expect(await screen.findByText('FAQ output')).toBeInTheDocument();
    expect(generate.mock.calls[0][2]).toContain('based on this HTML content:\n\n# Hello');
  });

  it('falls back to the raw HTML when conversion returns nothing', async () => {
    stubFetch(jsonReply({}));
    generate.mockResolvedValue({ content: 'FAQ output', usage: USAGE });
    renderTool(HtmlFaqGenerator);

    fireEvent.change(screen.getByLabelText('Or Paste HTML'), { target: { value: html } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));

    await screen.findByText('FAQ output');
    expect(generate.mock.calls[0][2]).toContain(html);
  });

  it('loads an uploaded HTML file into the box', async () => {
    const { container } = renderTool(HtmlFaqGenerator);
    const upload = new File([html], 'page.html', { type: 'text/html' });
    Object.defineProperty(upload, 'text', { value: async () => html });

    await act(async () => {
      uploadTo(container, upload);
    });

    await waitFor(() => expect((screen.getByLabelText('Or Paste HTML') as HTMLTextAreaElement).value).toBe(html));
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [] } });
    });
  });

  it('shows failures and asks for a key', async () => {
    stubFetch(jsonReply({ error: 'Bad HTML' }, { ok: false, status: 400 }));
    renderTool(HtmlFaqGenerator);
    fireEvent.change(screen.getByLabelText('Or Paste HTML'), { target: { value: html } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));
    expect(await findAlert('Bad HTML')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));
    expect(await findAlert('Failed to parse HTML')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));
    expect(await findAlert('Failed to generate FAQs')).toBeInTheDocument();

    localStorage.clear();
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
  });

  it('uses the chosen number of FAQs and tone', async () => {
    stubFetch(jsonReply({ data: { markdown: '# Hello' } }));
    generate.mockResolvedValue({ content: 'FAQ output', usage: USAGE });
    renderTool(HtmlFaqGenerator);
    fireEvent.change(screen.getByLabelText('Or Paste HTML'), { target: { value: html } });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: '30 FAQs' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Casual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));

    await waitFor(() => expect(generate).toHaveBeenCalled());
    expect(generate.mock.calls[0][2]).toContain('Generate 30 FAQs in a casual tone');
  });
});

describe('website-faq-generator', () => {
  const url = () => screen.getByLabelText('Website URL');
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Generate FAQs' }));

  it('scrapes the site and writes FAQs from its content', async () => {
    const fetchMock = stubFetch(jsonReply({ data: { content: 'Opening hours are 9 to 5.' } }));
    generate.mockResolvedValue({ content: 'Website FAQs', usage: USAGE });
    renderTool(WebsiteFaqGenerator);
    expect(screen.getByRole('button', { name: 'Generate FAQs' })).toBeDisabled();

    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    submit();

    expect(await screen.findByText('Website FAQs')).toBeInTheDocument();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      url: 'https://example.org',
    });
    expect(generate.mock.calls[0][2]).toContain('Opening hours are 9 to 5.');
  });

  it('reads content from the flat answer too, and refuses an empty site', async () => {
    stubFetch(jsonReply({ content: 'Flat content' }));
    generate.mockResolvedValue({ content: 'Flat FAQs', usage: USAGE });
    renderTool(WebsiteFaqGenerator);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    submit();
    await screen.findByText('Flat FAQs');
    expect(generate.mock.calls[0][2]).toContain('Flat content');

    stubFetch(jsonReply({}));
    submit();
    expect(await findAlert('No content found on the website')).toBeInTheDocument();
  });

  it('shows failures, validates the URL and asks for a key', async () => {
    renderTool(WebsiteFaqGenerator);
    fireEvent.change(url(), { target: { value: 'nope' } });
    fireEvent.blur(url());
    submit();
    expect(await screen.findByText('Please enter a valid URL')).toBeInTheDocument();

    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    stubFetch(jsonReply({ error: 'Blocked' }, { ok: false, status: 400 }));
    submit();
    expect(await findAlert('Blocked')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    submit();
    expect(await findAlert('Failed to fetch website content')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    submit();
    expect(await findAlert('Failed to generate FAQs')).toBeInTheDocument();

    localStorage.clear();
    submit();
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
  });

  it('shows the working state while generating', async () => {
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
    renderTool(WebsiteFaqGenerator);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });

    submit();

    expect(await screen.findByRole('button', { name: 'Generating FAQs...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });

  it('shows the working state, a rejected key and the FAQ settings', async () => {
    stubFetch(jsonReply({ content: 'x' }));
    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 403));
    renderTool(WebsiteFaqGenerator);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: /^5/ }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Friendly' }));
    submit();

    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(generate.mock.calls[0][2]).toContain('Generate 5 FAQs in a friendly tone');
  });
});
