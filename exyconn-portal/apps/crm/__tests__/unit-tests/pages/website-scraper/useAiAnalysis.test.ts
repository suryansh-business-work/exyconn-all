import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useAiAnalysis } from '../../../../src/pages/website-scraper/useAiAnalysis';
import { renderHookWithProviders } from '../../test-utils';
import { estimate } from './scraper-fixtures';

const gql = vi.hoisted(() => ({
  fetchEstimate: vi.fn(),
  analyze: vi.fn(),
  estimating: false,
  analyzing: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebScrapeAiEstimateLazyQuery: () => [gql.fetchEstimate, { loading: gql.estimating }],
  useAnalyzeWebScrapeMutation: () => [gql.analyze, { loading: gql.analyzing }],
}));

const renderAnalysis = () => renderHookWithProviders(() => useAiAnalysis('scrape-1')).result;

describe('useAiAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.estimating = false;
    gql.analyzing = false;
    gql.fetchEstimate.mockResolvedValue({ data: { webScrapeAiEstimate: estimate() } });
    gql.analyze.mockResolvedValue({ data: { analyzeWebScrape: { id: 'scrape-1' } } });
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('prices the instruction first and holds it until the person decides', async () => {
    const result = renderAnalysis();

    await act(() => result.current.requestEstimate('Who runs it?'));

    expect(gql.fetchEstimate).toHaveBeenCalledWith({
      variables: { id: 'scrape-1', instruction: 'Who runs it?' },
    });
    expect(result.current.pending).toEqual({ instruction: 'Who runs it?', estimate: estimate() });
    expect(gql.analyze).not.toHaveBeenCalled();
  });

  it('sends the held instruction on Proceed and clears it', async () => {
    const result = renderAnalysis();
    await act(() => result.current.requestEstimate('Who runs it?'));

    await act(() => result.current.proceed());

    expect(gql.analyze).toHaveBeenCalledWith({
      variables: { id: 'scrape-1', instruction: 'Who runs it?' },
    });
    expect(result.current.pending).toBeNull();
  });

  it('spends nothing on Cancel, or on Proceed with nothing priced', async () => {
    const result = renderAnalysis();
    await act(() => result.current.requestEstimate('Who runs it?'));

    act(() => result.current.cancel());
    expect(result.current.pending).toBeNull();

    await act(() => result.current.proceed());
    expect(gql.analyze).not.toHaveBeenCalled();
  });

  it('shows and logs the error the estimate query returns', async () => {
    const failure = new Error('AI is not configured');
    gql.fetchEstimate.mockResolvedValue({ data: undefined, error: failure });
    const result = renderAnalysis();

    await act(() => result.current.requestEstimate('Who runs it?'));

    expect(result.current.error).toBe('AI is not configured');
    expect(result.current.pending).toBeNull();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: estimating the AI cost of a scraped page failed',
      failure,
    );
  });

  it('treats an empty answer as a failed estimate', async () => {
    gql.fetchEstimate.mockResolvedValue({ data: undefined });
    const result = renderAnalysis();

    await act(() => result.current.requestEstimate('Who runs it?'));

    expect(result.current.error).toBe('No estimate came back');
  });

  it('falls back to a plain message when the estimate failure carries none', async () => {
    gql.fetchEstimate.mockRejectedValue('offline');
    const result = renderAnalysis();

    await act(() => result.current.requestEstimate('Who runs it?'));

    expect(result.current.error).toBe('Could not estimate the AI cost.');
  });

  it('shows and logs a failed AI call, and clears the error on the next request', async () => {
    const failure = new Error('Model overloaded');
    gql.analyze.mockRejectedValue(failure);
    const result = renderAnalysis();
    await act(() => result.current.requestEstimate('Who runs it?'));

    await act(() => result.current.proceed());
    expect(result.current.error).toBe('Model overloaded');
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: sending a scraped page to the AI failed',
      failure,
    );

    await act(() => result.current.requestEstimate('Who runs it?'));
    expect(result.current.error).toBeNull();
  });

  it('falls back to a plain message when the AI failure carries none', async () => {
    gql.analyze.mockRejectedValue('offline');
    const result = renderAnalysis();
    await act(() => result.current.requestEstimate('Who runs it?'));

    await act(() => result.current.proceed());

    expect(result.current.error).toBe('The AI could not read the page.');
  });

  it('is busy while pricing or while the AI reads the page', () => {
    expect(renderAnalysis().current).toMatchObject({ busy: false, analyzing: false });

    gql.estimating = true;
    expect(renderAnalysis().current).toMatchObject({ busy: true, analyzing: false });

    gql.estimating = false;
    gql.analyzing = true;
    expect(renderAnalysis().current).toMatchObject({ busy: true, analyzing: true });
  });
});
