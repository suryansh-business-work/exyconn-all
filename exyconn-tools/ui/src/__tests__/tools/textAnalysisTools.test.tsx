import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import AiTextGenerator from '../../tools/ai-text-generator';
import ParagraphRewriter from '../../tools/paragraph-rewriter';
import ParaphrasingTool from '../../tools/paraphrasing-tool';
import PlagiarismChecker from '../../tools/plagiarism-checker';
import SentenceRewriter from '../../tools/sentence-rewriter';
import SummaryGenerator from '../../tools/summary-generator';

const TEXT = 'This is a sample paragraph with enough characters to analyse.';

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const rewrite = (readability: string, suggestions: string[]) => ({
  original: TEXT,
  wordCount: 10,
  sentenceCount: 2,
  averageSentenceLength: 5,
  readability,
  suggestions,
  style: 'professional',
  note: 'Analysis only',
});

const REWRITERS: Array<[string, React.ComponentType, string, string]> = [
  ['paragraph-rewriter', ParagraphRewriter, 'Enter text', 'professional'],
  ['sentence-rewriter', SentenceRewriter, 'Enter sentence(s)', 'sentence'],
  ['paraphrasing-tool', ParaphrasingTool, 'Enter text', 'paraphrase'],
];

describe.each(REWRITERS)('%s', (_id, Tool, boxLabel, style) => {
  const analyse = (container: HTMLElement) => {
    fireEvent.change(screen.getByLabelText(boxLabel), { target: { value: TEXT } });
    fireEvent.click(container.querySelector('button.MuiButton-contained') as HTMLElement);
  };

  it('needs enough text before it can analyse', () => {
    const { container } = renderTool(Tool);
    const button = container.querySelector('button.MuiButton-contained') as HTMLElement;

    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(boxLabel), { target: { value: 'short' } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(boxLabel), { target: { value: TEXT } });
    expect(button).toBeEnabled();
  });

  it('shows the analysis and its suggestions for each readability level', async () => {
    for (const [level, suggestions] of [
      ['Easy', ['Add more detail']],
      ['Moderate', []],
      ['Complex', ['Shorten sentences']],
    ] as Array<[string, string[]]>) {
      const fetchMock = stubFetch(apiOk(rewrite(level, suggestions)));
      const { container, unmount } = renderTool(Tool);

      analyse(container);

      expect(await screen.findByText(`Readability: ${level}`)).toBeInTheDocument();
      expect(screen.getByText('10 words')).toBeInTheDocument();
      expect(screen.getByText('2 sentences')).toBeInTheDocument();
      for (const suggestion of suggestions) {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      }
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(String(init.body))).toEqual({ text: TEXT, style });
      unmount();
    }
  });

  it('shows the API error, or a generic one', async () => {
    stubFetch(jsonReply({ success: false, error: 'Rewrite unavailable' }));
    const { container } = renderTool(Tool);
    analyse(container);
    expect(await findAlert('Rewrite unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Rewrite unavailable')).not.toBeInTheDocument());

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(container.querySelector('button.MuiButton-contained') as HTMLElement);
    expect(await findAlert('Failed')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed')).not.toBeInTheDocument());
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

    analyse(container);

    expect(await screen.findByText('Analyzing...')).toBeInTheDocument();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('summary-generator', () => {
  const SUMMARY = {
    summary: 'A short summary.',
    originalLength: 200,
    summaryLength: 16,
    compressionRatio: 92,
    totalSentences: 6,
    summarySentences: 1,
  };

  it('posts the text, shows the summary with its figures and copies it', async () => {
    const fetchMock = stubFetch(apiOk(SUMMARY));
    renderTool(SummaryGenerator);
    const button = screen.getByRole('button', { name: 'Generate Summary' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Enter text'), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));

    expect(await screen.findByText('A short summary.')).toBeInTheDocument();
    expect(screen.getByText('92% compressed')).toBeInTheDocument();
    expect(screen.getByText('1/6 sentences')).toBeInTheDocument();
    expect(screen.getByText('16/200 chars')).toBeInTheDocument();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ text: TEXT });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A short summary.');
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'No summary' }));
    renderTool(SummaryGenerator);
    fireEvent.change(screen.getByLabelText('Enter text'), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));
    expect(await findAlert('No summary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));
    expect(await findAlert('Failed')).toBeInTheDocument();
    await clickAway();

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
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));
    expect(await screen.findByText('Generating...')).toBeInTheDocument();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('plagiarism-checker', () => {
  const result = (score: number, phrases: Array<{ phrase: string; count: number }>, readability = 'Moderate') => ({
    totalWords: 120,
    uniqueWords: 90,
    uniquenessScore: score,
    totalSentences: 8,
    averageWordsPerSentence: 15,
    repeatedPhrases: phrases,
    readabilityLevel: readability,
    note: 'Basic analysis only',
  });

  it('shows the uniqueness score at each level, with repeated phrases when there are any', async () => {
    for (const [score, phrases, readability] of [
      [90, [], 'Easy'],
      [60, [{ phrase: 'the quick brown', count: 3 }], 'Moderate'],
      [20, [{ phrase: 'again and again', count: 2 }], 'Complex'],
    ] as Array<[number, Array<{ phrase: string; count: number }>, string]>) {
      const fetchMock = stubFetch(apiOk(result(score, phrases, readability)));
      renderTool(PlagiarismChecker);
      fireEvent.change(screen.getByLabelText('Enter text'), { target: { value: TEXT } });
      fireEvent.click(screen.getByRole('button', { name: 'Check Plagiarism' }));

      expect(await screen.findByText(`${score}%`)).toBeInTheDocument();
      expect(screen.getByText('Basic analysis only')).toBeInTheDocument();
      expect(screen.getByText('90 unique words')).toBeInTheDocument();
      expect(screen.getByText(`Readability: ${readability}`)).toBeInTheDocument();
      for (const { phrase } of phrases) {
        expect(screen.getByText(phrase)).toBeInTheDocument();
      }
      expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ text: TEXT });
      cleanup();
    }
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'Check refused' }));
    renderTool(PlagiarismChecker);
    fireEvent.change(screen.getByLabelText('Enter text'), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Check Plagiarism' }));
    expect(await findAlert('Check refused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Check Plagiarism' }));
    expect(await findAlert('Check failed')).toBeInTheDocument();
    await clickAway();

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
    fireEvent.click(screen.getByRole('button', { name: 'Check Plagiarism' }));
    expect(await screen.findByText('Analyzing...')).toBeInTheDocument();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('ai-text-generator', () => {
  const analysis = {
    analysis: { characterCount: 120, wordCount: 20, sentenceCount: 2, readabilityGrade: 'Grade 8' },
    suggestions: ['Add a call to action'],
  };

  it('sends the brief and shows the generated summary of the analysis', async () => {
    const fetchMock = stubFetch(apiOk(analysis));
    renderTool(AiTextGenerator);
    const generate = screen.getByRole('button', { name: 'Generate' });
    expect(generate).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Topic / Subject'), { target: { value: 'remote work' } });
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Tagline / Slogan' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Witty' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText(/Readability Grade: Grade 8/)).toBeInTheDocument();
    expect(screen.getByText(/Add a call to action/)).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      text: 'Generate a Tagline / Slogan about: remote work. Tone: witty.',
      style: 'tagline',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'No generator' }));
    renderTool(AiTextGenerator);
    fireEvent.change(screen.getByLabelText('Topic / Subject'), { target: { value: 'remote work' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await findAlert('No generator')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await findAlert('Failed to generate')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await findAlert('An error occurred')).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(await screen.findByRole('button', { name: 'Generating...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});
