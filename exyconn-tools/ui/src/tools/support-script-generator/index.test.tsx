import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { clickAway, renderTool } from '../../__tests__/helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);
vi.mock('../../shared/services/openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/services/openai')>();
  return { ...actual, generateWithOpenAI: vi.fn() };
});

import { OpenAIRequestError, generateWithOpenAI } from '../../shared/services/openai';
import SupportScriptGenerator from './index';

const generate = vi.mocked(generateWithOpenAI);
const USAGE = { promptTokens: 4, completionTokens: 9, totalTokens: 13 };

beforeEach(() => {
  generate.mockReset();
  localStorage.clear();
  localStorage.setItem('openai_api_key', 'sk-script-0123456789');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const fill = (topic = 'Product returns', industry = 'E-commerce') => {
  fireEvent.change(screen.getByLabelText(/Support Topic/), { target: { value: topic } });
  fireEvent.change(screen.getByLabelText(/Industry/), { target: { value: industry } });
};
const submit = (container: HTMLElement) => fireEvent.submit(container.querySelector('form') as HTMLFormElement);

describe('support-script-generator', () => {
  it('sends the details with the default tone and shows the script with token use', async () => {
    generate.mockResolvedValue({ content: 'Hello, thanks for calling.', usage: USAGE });
    const { container } = renderTool(SupportScriptGenerator);
    fill();

    submit(container);

    expect(await screen.findByText('Hello, thanks for calling.')).toBeInTheDocument();
    const [key, system, prompt] = generate.mock.calls[0];
    expect(key).toBe('sk-script-0123456789');
    expect(system).toContain('customer support script writer');
    expect(prompt).toContain('Topic: Product returns');
    expect(prompt).toContain('Industry: E-commerce');
    expect(prompt).toContain('Tone: professional');
    expect(prompt).not.toContain('Specific Scenarios');
    expect(screen.getByText('Output: 9')).toBeInTheDocument();
  });

  it('adds the chosen tone and the specific scenarios', async () => {
    generate.mockResolvedValue({ content: 'Script', usage: USAGE });
    const { container } = renderTool(SupportScriptGenerator);
    fill();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Empathetic' }));
    fireEvent.change(screen.getByLabelText(/Specific Scenarios/), { target: { value: 'Late delivery' } });

    submit(container);

    await screen.findByText('Script');
    expect(generate.mock.calls[0][2]).toContain('Tone: empathetic');
    expect(generate.mock.calls[0][2]).toContain('Specific Scenarios:\nLate delivery');
  });

  it('asks for a topic and industry before generating', async () => {
    const { container } = renderTool(SupportScriptGenerator);
    fireEvent.change(screen.getByLabelText(/Support Topic/), { target: { value: 'ab' } });
    fireEvent.blur(screen.getByLabelText(/Support Topic/));
    fireEvent.blur(screen.getByLabelText(/Industry/));
    submit(container);

    expect(await screen.findByText('Must be at least 3 characters')).toBeInTheDocument();
    expect(await screen.findByText('Industry is required')).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
  });

  it('asks for a key when none is stored', async () => {
    localStorage.clear();
    const { container } = renderTool(SupportScriptGenerator);
    fill();
    submit(container);
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
  });

  it('shows failures, asks for a new key when rejected, and falls back to a generic message', async () => {
    const { container } = renderTool(SupportScriptGenerator);
    fill();

    generate.mockRejectedValueOnce(new Error('Overloaded'));
    submit(container);
    expect(await screen.findByText('Overloaded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Overloaded')).toBeNull());

    generate.mockRejectedValueOnce(new OpenAIRequestError('Bad key', 401));
    submit(container);
    expect(await screen.findByText('OpenAI API Key required')).toBeInTheDocument();

    generate.mockRejectedValueOnce('boom');
    submit(container);
    expect(await screen.findByText('Failed to generate script')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed to generate script')).toBeNull());
  });

  it('disables the form and shows the progress label while the script is being written', async () => {
    let finish: (value: { content: string; usage: typeof USAGE }) => void = () => undefined;
    generate.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { container } = renderTool(SupportScriptGenerator);
    fill();

    submit(container);

    expect(await screen.findByRole('button', { name: 'Generating Script...' })).toBeDisabled();
    await act(async () => finish({ content: 'Finished script', usage: USAGE }));
    expect(await screen.findByText('Finished script')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Support Script' })).toBeEnabled();
  });
});
