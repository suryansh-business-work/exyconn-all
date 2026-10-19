import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { AiAnalysisPanel } from '../../../../src/pages/website-scraper/AiAnalysisPanel';
import type { PendingAnalysis } from '../../../../src/pages/website-scraper/useAiAnalysis';
import { renderWithProviders } from '../../test-utils';
import { press } from '../../form-helpers';
import { estimate, scrapeRow } from './scraper-fixtures';

const ai = vi.hoisted(() => ({
  scrapeId: '',
  state: {
    pending: null as PendingAnalysis | null,
    error: null as string | null,
    busy: false,
    analyzing: false,
  },
  requestEstimate: vi.fn(),
  proceed: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('../../../../src/pages/website-scraper/useAiAnalysis', () => ({
  useAiAnalysis: (scrapeId: string) => {
    ai.scrapeId = scrapeId;
    return {
      ...ai.state,
      requestEstimate: ai.requestEstimate,
      proceed: ai.proceed,
      cancel: ai.cancel,
    };
  },
}));

describe('AiAnalysisPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ai.state = { pending: null, error: null, busy: false, analyzing: false };
    ai.requestEstimate.mockResolvedValue(undefined);
    ai.proceed.mockResolvedValue(undefined);
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('prices the instruction for this page when submitted', async () => {
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow({ aiInstruction: 'Who runs it?' })} />);

    await press('Send to AI');

    expect(ai.scrapeId).toBe('scrape-1');
    expect(ai.requestEstimate).toHaveBeenCalledWith('Who runs it?');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs a pricing step that fails unexpectedly', async () => {
    const failure = new Error('boom');
    ai.requestEstimate.mockRejectedValue(failure);
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow()} />);

    await press('Send to AI');

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('crm: website scraper AI step', failure),
    );
  });

  it('asks before spending, then proceeds or cancels', async () => {
    ai.state.pending = { instruction: 'Who runs it?', estimate: estimate() };
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow()} />);

    expect(screen.getByRole('dialog', { name: 'Send this page to the AI?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Proceed' }));
    expect(ai.proceed).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(ai.cancel).toHaveBeenCalledTimes(1);
  });

  it('logs an AI step that fails unexpectedly after Proceed', async () => {
    const failure = new Error('boom');
    ai.proceed.mockRejectedValue(failure);
    ai.state.pending = { instruction: 'Who runs it?', estimate: estimate() };
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Proceed' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('crm: website scraper AI step', failure),
    );
  });

  it('shows progress while the AI reads, and the error when it fails', () => {
    ai.state = { pending: null, error: 'Model overloaded', busy: true, analyzing: true };
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow()} />);

    expect(screen.getByRole('progressbar', { name: 'The AI is reading the page' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Model overloaded');
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  });

  it('shows the last AI answer with its cost', () => {
    renderWithProviders(
      <AiAnalysisPanel
        scrape={scrapeRow({
          aiResponse: 'Acme sells anvils to cartoon coyotes.',
          aiCostUsd: 0.0031,
          analyzedAt: '2026-10-02T09:00:00.000Z',
        })}
      />,
    );

    expect(screen.getByText('AI answer')).toBeInTheDocument();
    expect(screen.getByText('Acme sells anvils to cartoon coyotes.')).toBeInTheDocument();
    expect(screen.getByText(/^Cost \$0\.0031 · /)).toBeInTheDocument();
  });

  it('counts an answer with no recorded cost as free', () => {
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow({ aiResponse: 'An answer' })} />);

    expect(screen.getByText(/^Cost \$0\.00 ·/)).toBeInTheDocument();
  });

  it('shows no answer for a page never sent to the AI', () => {
    renderWithProviders(<AiAnalysisPanel scrape={scrapeRow()} />);

    expect(screen.queryByText('AI answer')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
