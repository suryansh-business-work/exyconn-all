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
import ChatWithDocuments from '../../tools/chat-with-documents';
import ChatWithPdf from '../../tools/chat-with-pdf';
import ChatWithText from '../../tools/chat-with-text';
import ChatWithWebsite from '../../tools/chat-with-website';
import ChatWithWord from '../../tools/chat-with-word';

const generate = vi.mocked(generateWithOpenAI);
const USAGE = { promptTokens: 11, completionTokens: 22, totalTokens: 33 };

beforeEach(() => {
  generate.mockReset();
  localStorage.clear();
  localStorage.setItem('openai_api_key', 'sk-chat-0123456789');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const ask = (placeholder: string, question: string) => {
  const box = screen.getByPlaceholderText(placeholder);
  fireEvent.change(box, { target: { value: question } });
  fireEvent.submit(box.closest('form') as HTMLFormElement);
};

describe('chat-with-text', () => {
  const TEXT = 'The warranty covers parts and labour for two years from purchase.';

  const setContent = () => {
    fireEvent.change(screen.getByPlaceholderText('Paste any text you want to chat about...'), {
      target: { value: TEXT },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set Content' }));
  };

  it('keeps chat locked until enough text has been set, and unlocks again when the text changes', () => {
    renderTool(ChatWithText);
    const box = screen.getByPlaceholderText('Paste any text you want to chat about...');

    expect(screen.getByRole('button', { name: 'Set Content' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Ask about this text...')).toBeDisabled();
    fireEvent.change(box, { target: { value: 'too short' } });
    expect(screen.getByRole('button', { name: 'Set Content' })).toBeDisabled();

    setContent();
    expect(screen.getByRole('button', { name: 'Content Ready' })).toBeInTheDocument();
    expect(screen.getByText(`Content set! (${TEXT.length} chars)`)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about this text...')).toBeEnabled();

    fireEvent.change(box, { target: { value: `${TEXT} More.` } });
    expect(screen.getByRole('button', { name: 'Set Content' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about this text...')).toBeDisabled();
  });

  it('answers a question about the text and shows the token use', async () => {
    generate.mockResolvedValue({ content: 'Two years.', usage: USAGE });
    renderTool(ChatWithText);
    setContent();

    ask('Ask about this text...', 'How long is the warranty?');

    expect(await screen.findByText('Two years.')).toBeInTheDocument();
    expect(screen.getByText('How long is the warranty?')).toBeInTheDocument();
    expect(screen.getByText('Total: 33')).toBeInTheDocument();
    const [key, , prompt] = generate.mock.calls[0];
    expect(key).toBe('sk-chat-0123456789');
    expect(prompt).toBe(`Text Content:\n${TEXT}\n\nQuestion: How long is the warranty?`);
  });

  it('asks for a key when there is none, and shows failures', async () => {
    localStorage.clear();
    renderTool(ChatWithText);
    setContent();
    ask('Ask about this text...', 'Anything?');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();

    localStorage.setItem('openai_api_key', 'sk-late-0123456789');
    generate.mockRejectedValueOnce(new Error('Overloaded'));
    ask('Ask about this text...', 'Try again?');
    expect(await findAlert('Overloaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 401));
    ask('Ask about this text...', 'Once more?');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();

    generate.mockRejectedValueOnce('boom');
    ask('Ask about this text...', 'Again?');
    expect(await findAlert('Failed to generate')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed to generate')).not.toBeInTheDocument());
  });
});

describe('chat-with-website', () => {
  const fetchSite = () => {
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Website' }));
  };

  it('fetches the page and answers questions about it', async () => {
    const fetchMock = stubFetch(jsonReply({ content: 'Opening hours: 9 to 5.' }));
    generate.mockResolvedValue({ content: 'Nine to five.', usage: USAGE });
    renderTool(ChatWithWebsite);
    expect(screen.getByRole('button', { name: 'Fetch Website' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Ask about this website...')).toBeDisabled();

    fetchSite();
    await waitFor(() => expect(screen.getByPlaceholderText('Ask about this website...')).toBeEnabled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ url: 'https://example.org' });

    ask('Ask about this website...', 'When are you open?');
    expect(await screen.findByText('Nine to five.')).toBeInTheDocument();
    expect(generate.mock.calls[0][2]).toBe('Website Content:\nOpening hours: 9 to 5.\n\nQuestion: When are you open?');
  });

  it('shows why the page could not be fetched', async () => {
    stubFetch(jsonReply({ error: 'Blocked address' }, { ok: false, status: 400 }));
    renderTool(ChatWithWebsite);
    fetchSite();
    expect(await findAlert('Blocked address')).toBeInTheDocument();

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Website' }));
    await waitFor(() => expect(screen.getByText('Failed to fetch')).toBeInTheDocument());

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Website' }));
    await waitFor(() => expect(screen.getByText('Failed to fetch website')).toBeInTheDocument());
  });

  it('locks the button while fetching, and asks for a key before answering', async () => {
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
    localStorage.clear();
    renderTool(ChatWithWebsite);

    fetchSite();
    expect(await screen.findByRole('button', { name: 'Fetching...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ content: 'Page text' })));
    await waitFor(() => expect(screen.getByPlaceholderText('Ask about this website...')).toBeEnabled());

    ask('Ask about this website...', 'What is this?');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
  });
});

describe('chat-with-website answering failures', () => {
  it('shows why an answer could not be generated, and lets the notice be closed', async () => {
    stubFetch(jsonReply({ content: 'Page text' }));
    renderTool(ChatWithWebsite);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Website' }));
    await waitFor(() => expect(screen.getByPlaceholderText('Ask about this website...')).toBeEnabled());

    generate.mockRejectedValueOnce(new Error('Overloaded'));
    ask('Ask about this website...', 'Question one');
    expect(await findAlert('Overloaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Overloaded')).not.toBeInTheDocument());

    generate.mockRejectedValueOnce('boom');
    ask('Ask about this website...', 'Question two');
    expect(await findAlert('Failed to generate')).toBeInTheDocument();

    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 403));
    ask('Ask about this website...', 'Question three');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
  });
});

interface FileCase {
  name: string;
  Tool: React.ComponentType;
  placeholder: string;
  file: File;
  mime: string;
  promptPrefix: string;
  fallback: string;
}

const FILE_CASES: FileCase[] = [
  {
    name: 'chat-with-pdf',
    Tool: ChatWithPdf,
    placeholder: 'Ask about this PDF...',
    file: new File(['%PDF-1.4 body'], 'terms.pdf', { type: 'application/pdf' }),
    mime: 'application/pdf',
    promptPrefix: 'PDF Content:',
    fallback: 'Failed to extract',
  },
  {
    name: 'chat-with-documents',
    Tool: ChatWithDocuments,
    placeholder: 'Ask about this document...',
    file: new File(['plain words'], 'notes.txt', { type: 'text/plain' }),
    mime: 'text/plain',
    promptPrefix: 'Document Content:',
    fallback: 'Failed to extract',
  },
  {
    name: 'chat-with-word',
    Tool: ChatWithWord,
    placeholder: 'Ask about this document...',
    file: new File(['docx bytes'], 'brief.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    promptPrefix: 'Word Document Content:',
    fallback: 'Failed to extract',
  },
];

describe.each(FILE_CASES)('$name', ({ Tool, placeholder, file, mime, promptPrefix }) => {
  const upload = (container: HTMLElement, chosen: File) =>
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [chosen] },
    });

  it('extracts the uploaded file on the server and answers questions about it', async () => {
    const fetchMock = stubFetch(jsonReply({ text: 'Extracted words' }));
    generate.mockResolvedValue({ content: 'An answer.', usage: USAGE });
    const { container } = renderTool(Tool);
    expect(screen.getByPlaceholderText(placeholder)).toBeDisabled();

    upload(container, file);

    expect(await screen.findByText(new RegExp(`${file.name} loaded! \\(15 chars\\)`))).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ mimeType: mime, fileName: file.name });
    ask(placeholder, 'Summarise it');
    expect(await screen.findByText('An answer.')).toBeInTheDocument();
    expect(generate.mock.calls[0][2]).toBe(`${promptPrefix}\nExtracted words\n\nQuestion: Summarise it`);
  });

  it('ignores a cancelled picker', () => {
    const fetchMock = stubFetch();
    const { container } = renderTool(Tool);

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [] } });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows why extraction failed and unlocks the picker again', async () => {
    stubFetch(jsonReply({ error: 'Unreadable file' }, { ok: false, status: 400 }));
    const { container } = renderTool(Tool);
    upload(container, file);
    expect(await findAlert('Unreadable file')).toBeInTheDocument();

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    upload(container, file);
    expect(await findAlert('Failed to extract')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Extracting...')).not.toBeInTheDocument());

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    upload(container, file);
    expect(await findAlert(/^Failed to extract/)).toBeInTheDocument();
  });

  it('shows the extracting state, and asks for a key and reports failures when asking', async () => {
    let finish: (value: unknown) => void = () => undefined;
    const pending = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal('fetch', pending);
    const { container } = renderTool(Tool);
    upload(container, file);
    expect(await screen.findByText('Extracting...')).toBeInTheDocument();
    await waitFor(() => expect(pending).toHaveBeenCalled());
    await act(async () => finish(jsonReply({ text: 'Extracted words' })));
    await waitFor(() => expect(screen.getByPlaceholderText(placeholder)).toBeEnabled());

    localStorage.clear();
    ask(placeholder, 'Question one');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();

    localStorage.setItem('openai_api_key', 'sk-late-0123456789');
    generate.mockRejectedValueOnce(new Error('Overloaded'));
    ask(placeholder, 'Question two');
    expect(await findAlert('Overloaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    generate.mockRejectedValueOnce('boom');
    ask(placeholder, 'Question three');
    expect(await findAlert('Failed to generate')).toBeInTheDocument();
    await clickAway();
  });
});
