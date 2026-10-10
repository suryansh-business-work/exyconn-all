import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, clickAway, jsonReply, renderTool, stubFetch } from '../../__tests__/helpers/toolHarness';
import GBPDescriptionGenerator from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const RESULT = {
  businessName: 'Acme Plumbing',
  descriptions: [
    { variant: 1, text: 'Acme Plumbing fixes pipes fast.', length: 31, isWithinLimit: true },
    { variant: 2, text: 'A much too long description.', length: 812, isWithinLimit: false },
  ],
  tips: ['Add photos weekly', 'Reply to every review'],
};

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const fillRequired = () => {
  fireEvent.change(screen.getByLabelText('Business Name'), { target: { value: '  Acme Plumbing ' } });
  fireEvent.change(screen.getByLabelText('Business Type'), { target: { value: 'plumber' } });
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Austin, TX' } });
};

const generate = () => fireEvent.click(screen.getByRole('button', { name: 'Generate Descriptions' }));

describe('gbp-description-generator', () => {
  it('keeps the button disabled until name, type and location are filled', () => {
    renderTool(GBPDescriptionGenerator);
    const button = screen.getByRole('button', { name: 'Generate Descriptions' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Business Name'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText('Business Type'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Austin' } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Business Type'), { target: { value: 'plumber' } });
    expect(button).toBeEnabled();
  });

  it('posts the trimmed details with the lists split on commas and shows the variants and tips', async () => {
    const fetchMock = stubFetch(apiOk(RESULT));
    renderTool(GBPDescriptionGenerator);
    fillRequired();
    fireEvent.change(screen.getByLabelText('Services (comma-separated)'), {
      target: { value: 'drain cleaning, , leak repair ,' },
    });
    fireEvent.change(screen.getByLabelText('Unique Points (comma-separated)'), {
      target: { value: '24/7 service' },
    });

    generate();

    expect(await screen.findByText('Variant 1')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      businessName: 'Acme Plumbing',
      businessType: 'plumber',
      location: 'Austin, TX',
      services: ['drain cleaning', 'leak repair'],
      uniquePoints: ['24/7 service'],
    });
    expect(screen.getByText('31/750 chars')).toBeInTheDocument();
    expect(screen.getByText('812/750 chars')).toBeInTheDocument();
    expect(screen.getByText('Acme Plumbing fixes pipes fast.')).toBeInTheDocument();
    expect(screen.getByText('Reply to every review')).toBeInTheDocument();
  });

  it('copies a variant and shows Copied! until the timer clears it', async () => {
    stubFetch(apiOk(RESULT));
    renderTool(GBPDescriptionGenerator);
    fillRequired();
    generate();
    await screen.findByText('Variant 2');

    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[1]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A much too long description.');
    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(2), {
      timeout: 3000,
    });
  });

  it('shows the server error and dismisses it', async () => {
    stubFetch(jsonReply({ success: false, error: 'Rate limited' }));
    renderTool(GBPDescriptionGenerator);
    fillRequired();
    generate();
    expect(await screen.findByText('Rate limited')).toBeInTheDocument();
    expect(screen.queryByText('Variant 1')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Rate limited')).toBeNull());
  });

  it('shows a generic message when the failure is not an Error, and closes it by clicking away', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    renderTool(GBPDescriptionGenerator);
    fillRequired();
    generate();
    expect(await screen.findByText('Failed')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed')).toBeNull());
  });

  it('shows the generating label while the request is pending', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => (finish = resolve)))
    );
    renderTool(GBPDescriptionGenerator);
    fillRequired();
    generate();
    expect(await screen.findByRole('button', { name: 'Generating...' })).toBeDisabled();
    finish(apiOk(RESULT));
    expect(await screen.findByText('Variant 1')).toBeInTheDocument();
  });
});
