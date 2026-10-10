import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, renderTool } from '../helpers/toolHarness';
import APIKeyInput from '../../shared/components/AIToolShared/APIKeyInput';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/services/openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/services/openai')>();
  return { ...actual, generateWithOpenAI: vi.fn() };
});

import { OpenAIRequestError, generateWithOpenAI } from '../../shared/services/openai';
import AiAnswerGenerator from '../../tools/ai-answer-generator';
import AiBlogTitleGenerator from '../../tools/ai-blog-title-generator';
import AiChatbotNameGenerator from '../../tools/ai-chatbot-name-generator';
import AiEmailReplyGenerator from '../../tools/ai-email-reply-generator';
import AiLetterGenerator from '../../tools/ai-letter-generator';
import AiPromptGenerator from '../../tools/ai-prompt-generator';
import AiPromptOptimizer from '../../tools/ai-prompt-optimizer';
import AiReplyGenerator from '../../tools/ai-reply-generator';
import AiSaasNameGenerator from '../../tools/ai-saas-name-generator';

const generate = vi.mocked(generateWithOpenAI);
const USAGE = { promptTokens: 10, completionTokens: 20, totalTokens: 30 };

interface Field {
  label: RegExp;
  value: string;
}

interface Case {
  name: string;
  Tool: React.ComponentType;
  button: string;
  required: Field[];
  optional?: Field[];
  /** A required field value that is too short, with the message the form shows for it. */
  invalid: { label: RegExp; value: string; message: string };
  /** What the prompt sent to OpenAI must contain once the required fields are filled. */
  promptHas: string[];
  /** What the prompt must contain once the optional fields are filled too. */
  promptHasOptional?: string[];
}

const CASES: Case[] = [
  {
    name: 'ai-answer-generator',
    Tool: AiAnswerGenerator,
    button: 'Get Answer',
    required: [{ label: /Your Question/, value: 'What is the capital of France?' }],
    optional: [{ label: /Context/, value: 'A geography quiz' }],
    invalid: { label: /Your Question/, value: 'Hi', message: 'Question must be at least 5 characters' },
    promptHas: ['What is the capital of France?'],
    promptHasOptional: ['Context: A geography quiz'],
  },
  {
    name: 'ai-blog-title-generator',
    Tool: AiBlogTitleGenerator,
    button: 'Generate Titles',
    required: [{ label: /Blog Topic/, value: 'Remote work productivity' }],
    optional: [{ label: /SEO Keywords/, value: 'async, focus' }],
    invalid: { label: /Blog Topic/, value: 'abc', message: 'Topic must be at least 5 characters' },
    promptHas: ['Remote work productivity'],
    promptHasOptional: ['async, focus'],
  },
  {
    name: 'ai-chatbot-name-generator',
    Tool: AiChatbotNameGenerator,
    button: 'Generate Names',
    required: [{ label: /Chatbot Purpose/, value: 'Answers billing questions for a bank' }],
    invalid: { label: /Chatbot Purpose/, value: 'short', message: 'Describe the purpose in more detail' },
    promptHas: ['Answers billing questions for a bank'],
  },
  {
    name: 'ai-email-reply-generator',
    Tool: AiEmailReplyGenerator,
    button: 'Generate Email Reply',
    required: [{ label: /Original Email/, value: 'Hello, can we reschedule our meeting to Friday?' }],
    invalid: { label: /Original Email/, value: 'Hi', message: 'Email must be at least 10 characters' },
    promptHas: ['Hello, can we reschedule our meeting to Friday?'],
  },
  {
    name: 'ai-letter-generator',
    Tool: AiLetterGenerator,
    button: 'Generate Letter',
    required: [
      { label: /Recipient/, value: 'Ms Rao' },
      { label: /^Purpose/, value: 'Apply for the platform engineer role' },
    ],
    optional: [{ label: /Additional Details/, value: 'Five years of experience' }],
    invalid: { label: /^Purpose/, value: 'short', message: 'Describe the purpose in more detail' },
    promptHas: ['Ms Rao', 'Apply for the platform engineer role'],
    promptHasOptional: ['Five years of experience'],
  },
  {
    name: 'ai-prompt-generator',
    Tool: AiPromptGenerator,
    button: 'Generate Prompt',
    required: [{ label: /Topic or Goal/, value: 'Summarise legal contracts' }],
    optional: [{ label: /Additional Context/, value: 'For paralegals' }],
    invalid: { label: /Topic or Goal/, value: 'ab', message: 'Topic must be at least 3 characters' },
    promptHas: ['Summarise legal contracts'],
    promptHasOptional: ['For paralegals'],
  },
  {
    name: 'ai-prompt-optimizer',
    Tool: AiPromptOptimizer,
    button: 'Optimize Prompt',
    required: [{ label: /Your Current Prompt/, value: 'Write me a poem about the sea' }],
    optional: [{ label: /Optimization Goal/, value: 'More vivid imagery' }],
    invalid: { label: /Your Current Prompt/, value: 'poem', message: 'Prompt must be at least 10 characters' },
    promptHas: ['Write me a poem about the sea'],
    promptHasOptional: ['More vivid imagery'],
  },
  {
    name: 'ai-reply-generator',
    Tool: AiReplyGenerator,
    button: 'Generate Reply',
    required: [{ label: /Original Message/, value: 'Are you free for lunch tomorrow?' }],
    optional: [{ label: /Additional Context/, value: 'I am vegetarian' }],
    invalid: { label: /Original Message/, value: 'Hi', message: 'Message must be at least 5 characters' },
    promptHas: ['Are you free for lunch tomorrow?'],
    promptHasOptional: ['I am vegetarian'],
  },
  {
    name: 'ai-saas-name-generator',
    Tool: AiSaasNameGenerator,
    button: 'Generate Names',
    required: [{ label: /Product Description/, value: 'Invoicing software for freelancers' }],
    optional: [{ label: /Keywords/, value: 'invoice, simple' }],
    invalid: { label: /Product Description/, value: 'short', message: 'Describe your product in more detail' },
    promptHas: ['Invoicing software for freelancers'],
    promptHasOptional: ['invoice, simple'],
  },
];

beforeEach(() => {
  generate.mockReset();
  localStorage.clear();
  localStorage.setItem('openai_api_key', 'sk-test-0123456789');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const fill = (fields: Field[]) => {
  for (const { label, value } of fields) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

describe.each(CASES)('$name', ({ Tool, button, required, optional, invalid, promptHas, promptHasOptional }) => {
  it('keeps the button disabled until the main field has text', () => {
    renderTool(Tool);

    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    fill(required);
    expect(screen.getByRole('button', { name: button })).toBeEnabled();
  });

  it('generates with the key from the browser and shows the result with its token usage', async () => {
    generate.mockResolvedValue({ content: 'Generated output text', usage: USAGE });
    const { container } = renderTool(Tool);

    fill(required);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('Generated output text')).toBeInTheDocument();
    const [key, system, user] = generate.mock.calls[0];
    expect(key).toBe('sk-test-0123456789');
    expect(system.length).toBeGreaterThan(20);
    for (const text of promptHas) {
      expect(user).toContain(text);
    }
    expect(screen.getByText('Output: 20')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Generated output text');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('adds the optional details to the prompt, and every chip and select can be changed', async () => {
    generate.mockResolvedValue({ content: 'More output', usage: USAGE });
    const { container } = renderTool(Tool);

    fill(required);
    if (optional) {
      fill(optional);
    }
    container.querySelectorAll('.MuiChip-clickable').forEach((chip) => fireEvent.click(chip));
    for (const combobox of screen.queryAllByRole('combobox')) {
      fireEvent.mouseDown(combobox);
      const options = await screen.findAllByRole('option');
      fireEvent.click(options[options.length - 1]);
    }
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('More output')).toBeInTheDocument();
    for (const text of promptHasOptional ?? promptHas) {
      expect(generate.mock.calls[0][2]).toContain(text);
    }
  });

  it('asks for a longer value before generating', async () => {
    const { container } = renderTool(Tool);

    fill(required);
    fireEvent.change(screen.getByLabelText(invalid.label), { target: { value: invalid.value } });
    fireEvent.blur(screen.getByLabelText(invalid.label));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText(invalid.message)).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
  });

  it('asks for a key instead of generating when none is stored', async () => {
    localStorage.clear();
    const { container } = renderTool(Tool);

    fill(required);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
  });

  it('shows the failure, and asks for a new key when OpenAI rejected it', async () => {
    generate.mockRejectedValueOnce(new Error('Rate limit reached'));
    const { container } = renderTool(Tool);
    fill(required);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await screen.findByText('Rate limit reached')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Rate limit reached')).not.toBeInTheDocument());

    generate.mockRejectedValueOnce(new OpenAIRequestError('Incorrect API key', 401));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();

    generate.mockRejectedValueOnce('boom');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    const fallback = await screen.findByText(/^Failed to (generate|optimi[sz]e)/);
    expect(fallback).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(fallback).not.toBeInTheDocument());
  });

  it('shows the generating state while waiting', async () => {
    let finish: (value: { content: string; usage: typeof USAGE }) => void = () => undefined;
    generate.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { container } = renderTool(Tool);
    fill(required);

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(within(container).getByRole('button', { name: /ing/ })).toBeDisabled());
    await act(async () => finish({ content: 'done', usage: USAGE }));
  });
});

describe('APIKeyInput', () => {
  it('saves a key, masks it, and removes it again', () => {
    localStorage.clear();
    renderTool(APIKeyInput);
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('sk-...'), { target: { value: '   ' } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('sk-...'), { target: { value: ' sk-abcdefghijkl ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(localStorage.getItem('openai_api_key')).toBe('sk-abcdefghijkl');
    expect(screen.getByText(/API Key saved: sk-\.\.\.efghijkl/)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Remove API Key'));
    expect(localStorage.getItem('openai_api_key')).toBeNull();
    expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument();
  });

  it('can show and hide the key while typing', () => {
    localStorage.clear();
    renderTool(APIKeyInput);
    const box = screen.getByPlaceholderText('sk-...');
    expect(box).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByTestId('VisibilityIcon').closest('button') as HTMLElement);
    expect(screen.getByPlaceholderText('sk-...')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByTestId('VisibilityOffIcon').closest('button') as HTMLElement);
    expect(screen.getByPlaceholderText('sk-...')).toHaveAttribute('type', 'password');
  });
});
