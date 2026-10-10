import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { ChatInput, ChatMessages } from '../../shared/components/ChatInterface';
import { AIResultDisplay, APIKeyInput, useOpenAIKey } from '../../shared/components/AIToolShared';
import DomainInputForm from '../../shared/components/DomainToolShared/DomainInputForm';
import DomainResultDisplay, { KeyValueTable } from '../../shared/components/DomainToolShared/DomainResultDisplay';
import { OpenAIProvider } from '../../shared/context/OpenAIContext';
import { OpenAIRequestError } from '../../shared/services/openai';
import { readSecret, writeSecret } from '../../shared/services/secrets';

const writeText = vi.fn();

beforeEach(() => {
  localStorage.clear();
  writeText.mockReset();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ChatInput', () => {
  it('sends the trimmed message and clears the box', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const box = screen.getByPlaceholderText('Type your question...');
    fireEvent.change(box, { target: { value: '  hello there  ' } });
    fireEvent.submit(box.closest('form') as HTMLFormElement);
    expect(onSend).toHaveBeenCalledWith('hello there');
    expect(box).toHaveValue('');
  });

  it('does not send an empty message, and keeps the send button disabled', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} placeholder="Ask" />);
    const box = screen.getByPlaceholderText('Ask');
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.change(box, { target: { value: '   ' } });
    fireEvent.submit(box.closest('form') as HTMLFormElement);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('refuses to send while loading or disabled, showing progress when loading', () => {
    const onSend = vi.fn();
    const { rerender } = render(<ChatInput onSend={onSend} isLoading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your question...')).toBeDisabled();

    rerender(<ChatInput onSend={onSend} isLoading={false} disabled />);
    expect(screen.getByPlaceholderText('Type your question...')).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button').closest('form') as HTMLFormElement);
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe('ChatMessages', () => {
  const stamp = new Date('2024-05-01T10:00:00Z');

  it('invites the first question when there are no messages', () => {
    render(<ChatMessages messages={[]} />);
    expect(screen.getByText(/Start a conversation/)).toBeInTheDocument();
  });

  it('shows each message in order, scrolls to the end and reports token usage', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    render(
      <ChatMessages
        messages={[
          { id: '1', role: 'user', content: 'What is this?', timestamp: stamp },
          { id: '2', role: 'assistant', content: 'A tool.', timestamp: stamp },
        ]}
        tokenUsage={{ promptTokens: 5, completionTokens: 7, totalTokens: 12 }}
      />
    );
    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(screen.getByText('A tool.')).toBeInTheDocument();
    expect(screen.getByText('In: 5')).toBeInTheDocument();
    expect(screen.getByText('Out: 7')).toBeInTheDocument();
    expect(screen.getByText('Total: 12')).toBeInTheDocument();
    expect(scroll).toHaveBeenCalled();
  });

  it('shows no usage row without token usage', () => {
    render(<ChatMessages messages={[{ id: '1', role: 'user', content: 'Hi', timestamp: stamp }]} />);
    expect(screen.queryByText(/^Total:/)).not.toBeInTheDocument();
  });
});

describe('AIResultDisplay', () => {
  it('renders nothing for an empty result', () => {
    const { container } = render(<AIResultDisplay result="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the result with its title and usage, and copies it', () => {
    vi.useFakeTimers();
    render(
      <AIResultDisplay
        result="Final text"
        title="Rewrite"
        tokenUsage={{ promptTokens: 1, completionTokens: 2, totalTokens: 3 }}
      />
    );
    expect(screen.getByText('Rewrite')).toBeInTheDocument();
    expect(screen.getByText('Prompt: 1')).toBeInTheDocument();
    expect(screen.getByText('Output: 2')).toBeInTheDocument();
    expect(screen.getByText('Total: 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(writeText).toHaveBeenCalledWith('Final text');
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument();
  });

  it('uses the default title and no usage row when none is given', () => {
    render(<AIResultDisplay result="x" />);
    expect(screen.getByText('Generated Result')).toBeInTheDocument();
    expect(screen.queryByText(/^Prompt:/)).not.toBeInTheDocument();
  });
});

describe('APIKeyInput', () => {
  const setup = () =>
    render(
      <OpenAIProvider>
        <APIKeyInput />
      </OpenAIProvider>
    );

  it('saves a trimmed key, shows it masked, and keeps the secrets store and context in step', () => {
    setup();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('sk-...'), { target: { value: '  sk-abcdefghijklmnop  ' } });
    fireEvent.click(save);
    expect(readSecret('openai_api_key')).toBe('sk-abcdefghijklmnop');
    expect(localStorage.getItem('openai_api_key')).toBe('sk-abcdefghijklmnop');
    expect(screen.getByText('API Key saved: sk-...ijklmnop')).toBeInTheDocument();
  });

  it('shows an existing key and clears it', () => {
    writeSecret('openai_api_key', 'sk-0123456789');
    setup();
    expect(screen.getByText('API Key saved: sk-...23456789')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove API Key'));
    expect(readSecret('openai_api_key')).toBe('');
    expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument();
  });

  it('toggles key visibility while typing', () => {
    setup();
    const field = screen.getByPlaceholderText('sk-...');
    expect(field).toHaveAttribute('type', 'password');
    const toggle = within(field.closest('.MuiInputBase-root') as HTMLElement).getByRole('button');
    fireEvent.click(toggle);
    expect(field).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(field).toHaveAttribute('type', 'password');
  });
});

describe('useOpenAIKey', () => {
  it('reads the key at the moment it is needed and flags a missing one', () => {
    const { result } = renderHook(() => useOpenAIKey());
    expect(result.current.needsKey).toBe(false);

    let key = 'unset';
    act(() => {
      key = result.current.requireKey();
    });
    expect(key).toBe('');
    expect(result.current.needsKey).toBe(true);

    writeSecret('openai_api_key', 'sk-live');
    act(() => {
      key = result.current.requireKey();
    });
    expect(key).toBe('sk-live');
    expect(result.current.needsKey).toBe(false);
  });

  it('asks for a key again only when OpenAI rejected the one sent', () => {
    const { result } = renderHook(() => useOpenAIKey());
    act(() => result.current.reportError(new OpenAIRequestError('rate limited', 429)));
    expect(result.current.needsKey).toBe(false);
    act(() => result.current.reportError(new Error('network')));
    expect(result.current.needsKey).toBe(false);
    act(() => result.current.reportError(new OpenAIRequestError('bad key', 401)));
    expect(result.current.needsKey).toBe(true);
  });
});

describe('DomainInputForm', () => {
  it('keeps the button disabled until something is typed, and submits the domain', async () => {
    const onSubmit = vi.fn();
    render(<DomainInputForm onSubmit={onSubmit} isLoading={false} />);
    const button = screen.getByRole('button', { name: 'Check' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.com' } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('example.com'));
  });

  it('rejects a value that is too short, with a hint', async () => {
    const onSubmit = vi.fn();
    render(<DomainInputForm onSubmit={onSubmit} isLoading={false} />);
    const field = screen.getByLabelText('Domain');
    fireEvent.change(field, { target: { value: 'ab' } });
    fireEvent.blur(field);
    expect(await screen.findByText('Enter a valid domain')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the loading label and custom copy', () => {
    render(
      <DomainInputForm
        onSubmit={vi.fn()}
        isLoading
        title="Check a domain"
        label="Host"
        placeholder="host.io"
        buttonText="Go"
        loadingText="Working..."
        icon={<span data-testid="icon" />}
      />
    );
    expect(screen.getByText('Check a domain')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Working...' })).toBeDisabled();
    expect(screen.getByPlaceholderText('host.io')).toBeInTheDocument();
  });
});

describe('DomainResultDisplay', () => {
  it('renders nothing without data', () => {
    const { container } = render(<DomainResultDisplay title="DNS" data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('copies the data as JSON and shows the confirmation for two seconds', () => {
    vi.useFakeTimers();
    render(
      <DomainResultDisplay title="DNS" data={{ a: 1 }} icon={<span data-testid="icon" />}>
        <p>body</p>
      </DomainResultDisplay>
    );
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Copy JSON'));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByLabelText('Copy JSON')).toBeInTheDocument();
  });

  it('downloads the data as a file named after the title', () => {
    const anchors: HTMLAnchorElement[] = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = create(tag);
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    }) as typeof document.createElement);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<DomainResultDisplay title="Whois Data" data={{ a: 1 }} />);
    fireEvent.click(screen.getByLabelText('Download JSON'));
    expect(anchors.at(-1)?.download).toBe('whois-data-result.json');
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });
});

describe('KeyValueTable', () => {
  it('spaces camelCase keys, formats booleans, objects and scalars, and skips excluded keys', () => {
    render(
      <KeyValueTable
        data={{ domainName: 'a.com', isActive: true, hasFlag: false, nameServers: ['ns1'], count: 3, secret: 'x' }}
        excludeKeys={['secret']}
      />
    );
    expect(screen.getByText('domain Name')).toBeInTheDocument();
    expect(screen.getByText('a.com')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText(/"ns1"/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});
