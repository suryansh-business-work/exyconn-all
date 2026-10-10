import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, clickAway, jsonReply, renderTool, stubFetch } from '../../__tests__/helpers/toolHarness';
import AISearchVisibility from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The shape the seo-check endpoint really returns (see server seo-tools services). */
const seoCheck = (overrides: Record<string, unknown> = {}) => ({
  url: 'https://brand.example',
  score: 88,
  title: { text: 'Brand', length: 5 },
  metaDescription: { text: 'About the brand', length: 15 },
  headings: { h1: ['Welcome'], h2: ['One', 'Two', 'Three'] },
  links: { internal: 12, external: 4, nofollow: 1, total: 16 },
  wordCount: 450,
  schemaMarkup: ['Organization'],
  ...overrides,
});

const check = (value: string) => {
  fireEvent.change(screen.getByLabelText('Website URL'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Check Visibility' }));
};

describe('ai-search-visibility', () => {
  it('starts with a prompt and a disabled button', () => {
    renderTool(AISearchVisibility);
    expect(screen.getByText('Enter your website URL to check AI search visibility')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check Visibility' })).toBeDisabled();
  });

  it('adds https, posts the URL and reports score, word count, structured data, headings and links', async () => {
    const fetchMock = stubFetch(apiOk(seoCheck()));
    renderTool(AISearchVisibility);

    check('brand.example');

    expect(await screen.findByText('AI Readiness Analysis')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ url: 'https://brand.example' });
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('H1: 1')).toBeInTheDocument();
    expect(screen.getByText('H2: 3')).toBeInTheDocument();
    expect(screen.getByText('Internal Links: 12')).toBeInTheDocument();
    expect(screen.getByText('External Links: 4')).toBeInTheDocument();
    expect(screen.getByText('Tips to Improve AI Visibility')).toBeInTheDocument();
    expect(screen.queryByText('Enter your website URL to check AI search visibility')).toBeNull();
  });

  it('keeps a URL that already has a scheme, and handles pages without schema or headings', async () => {
    const fetchMock = stubFetch(apiOk(seoCheck({ schemaMarkup: [], headings: {}, wordCount: 120 })));
    renderTool(AISearchVisibility);

    check('http://plain.example');

    expect(await screen.findByText('No')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ url: 'http://plain.example' });
    expect(screen.getByText('H1: 0')).toBeInTheDocument();
    expect(screen.getByText('H2: 0')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('checks on Enter only when a URL is typed', async () => {
    const fetchMock = stubFetch(apiOk(seoCheck()));
    renderTool(AISearchVisibility);
    const box = screen.getByLabelText('Website URL');

    fireEvent.keyDown(box, { key: 'Enter' });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: 'brand.example' } });
    fireEvent.keyDown(box, { key: 'Tab' });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(await screen.findByText('AI Readiness Analysis')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the server error, a default message, and a generic one, and clears the old result', async () => {
    stubFetch(apiOk(seoCheck()), jsonReply({ success: false, error: 'Site unreachable' }));
    renderTool(AISearchVisibility);
    check('brand.example');
    await screen.findByText('AI Readiness Analysis');

    fireEvent.click(screen.getByRole('button', { name: 'Check Visibility' }));
    expect(await screen.findByText('Site unreachable')).toBeInTheDocument();
    expect(screen.queryByText('AI Readiness Analysis')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Site unreachable')).toBeNull());

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Check Visibility' }));
    expect(await screen.findByText('Failed to analyze')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed to analyze')).toBeNull());

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Check Visibility' }));
    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
  });

  it('shows the analyzing state while the request is pending', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => (finish = resolve)))
    );
    renderTool(AISearchVisibility);
    check('brand.example');
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    finish(apiOk(seoCheck()));
    expect(await screen.findByText('AI Readiness Analysis')).toBeInTheDocument();
  });
});
