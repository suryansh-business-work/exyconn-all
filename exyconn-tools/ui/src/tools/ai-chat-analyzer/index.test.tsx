import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { clickAway, renderTool } from '../../__tests__/helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/services/openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/services/openai')>();
  return { ...actual, generateWithOpenAI: vi.fn() };
});

import { OpenAIRequestError, generateWithOpenAI } from '../../shared/services/openai';
import AIChatAnalyzer from './index';

const generate = vi.mocked(generateWithOpenAI);
const USAGE = { promptTokens: 5, completionTokens: 7, totalTokens: 12 };
const LOG = 'User: Where is my order?\nBot: Let me check.\nUser: It never arrived, this is the third time.';
const ASK = 'Ask about this chat log (e.g., What are the main issues?)';

beforeEach(() => {
  generate.mockReset();
  localStorage.clear();
  localStorage.setItem('openai_api_key', 'sk-analyze-0123456789');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const setLog = (value = LOG) => {
  fireEvent.change(screen.getByPlaceholderText(/User: Hello/), { target: { value } });
};
const setContent = () => {
  setLog();
  fireEvent.click(screen.getByRole('button', { name: 'Set Chat Log' }));
};
const ask = (question: string) => {
  const box = screen.getByPlaceholderText(ASK);
  fireEvent.change(box, { target: { value: question } });
  fireEvent.submit(box.closest('form') as HTMLFormElement);
};

describe('ai-chat-analyzer', () => {
  it('needs at least 50 characters, and locks the chat again when the log changes', () => {
    renderTool(AIChatAnalyzer);
    expect(screen.getByRole('button', { name: 'Set Chat Log' })).toBeDisabled();
    expect(screen.getByPlaceholderText(ASK)).toBeDisabled();

    setLog('too short');
    expect(screen.getByRole('button', { name: 'Set Chat Log' })).toBeDisabled();

    setContent();
    expect(screen.getByRole('button', { name: 'Ready to Analyze' })).toBeInTheDocument();
    expect(screen.getByText(`Chat log set! (${LOG.length} chars)`)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(ASK)).toBeEnabled();

    setLog(`${LOG} Please help.`);
    expect(screen.getByRole('button', { name: 'Set Chat Log' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(ASK)).toBeDisabled();
  });

  it('sends the log, the chosen focus area and the question, then shows the answer with token use', async () => {
    generate.mockResolvedValue({ content: 'Customers are waiting too long.', usage: USAGE });
    renderTool(AIChatAnalyzer);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Bot Accuracy' }));
    setContent();

    ask('What are the main issues?');

    expect(await screen.findByText('Customers are waiting too long.')).toBeInTheDocument();
    expect(screen.getByText('What are the main issues?')).toBeInTheDocument();
    const [key, system, prompt] = generate.mock.calls[0];
    expect(key).toBe('sk-analyze-0123456789');
    expect(system).toContain('chatbot conversation analyst');
    expect(prompt).toBe(`Chat Log to Analyze:\n${LOG}\n\nFocus: bot_accuracy\n\nQuestion: What are the main issues?`);
    expect(screen.getByText('Total: 12')).toBeInTheDocument();
  });

  it('omits the focus line for a general analysis and truncates the log to 10,000 characters', async () => {
    generate.mockResolvedValue({ content: 'ok', usage: USAGE });
    renderTool(AIChatAnalyzer);
    const longLog = 'x'.repeat(10500);
    setLog(longLog);
    fireEvent.click(screen.getByRole('button', { name: 'Set Chat Log' }));

    ask('Summarise');

    await screen.findByText('ok');
    expect(generate.mock.calls[0][2]).toBe(`Chat Log to Analyze:\n${'x'.repeat(10000)}\n\nQuestion: Summarise`);
  });

  it('asks for a key when none is stored instead of calling OpenAI', async () => {
    localStorage.clear();
    renderTool(AIChatAnalyzer);
    setContent();

    ask('Anything?');

    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
  });

  it('shows failures, asks for a new key when OpenAI rejects it, and falls back to a generic message', async () => {
    renderTool(AIChatAnalyzer);
    setContent();

    generate.mockRejectedValueOnce(new Error('Overloaded'));
    ask('First?');
    expect(await screen.findByText('Overloaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Overloaded')).toBeNull());

    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 401));
    ask('Second?');
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();

    generate.mockRejectedValueOnce('boom');
    ask('Third?');
    expect(await screen.findByText('Failed to analyze')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed to analyze')).toBeNull());
  });
});
