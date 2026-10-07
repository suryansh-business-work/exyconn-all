import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { AiInsightsPanel } from '../../../../src/pages/social/AiInsightsPanel';
import { renderWithProviders } from '../../test-utils';
import { chooseOption, fill } from '../../form-helpers';

const gql = vi.hoisted(() => ({
  analyse: vi.fn(),
  ideate: vi.fn(),
  analysis: { loading: false, data: undefined as unknown },
  ideas: { loading: false, data: undefined as unknown },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialMediaInsightsMutation: () => [gql.analyse, gql.analysis],
  useSocialMediaIdeasMutation: () => [gql.ideate, gql.ideas],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

describe('AiInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.analyse.mockResolvedValue({});
    gql.ideate.mockResolvedValue({});
    gql.analysis = { loading: false, data: undefined };
    gql.ideas = { loading: false, data: undefined };
  });

  it('analyses the posts of the chosen period', async () => {
    renderWithProviders(<AiInsightsPanel days={7} />);

    await userEvent.click(screen.getByRole('button', { name: 'Analyse the last 7 days' }));

    expect(gql.analyse).toHaveBeenCalledWith({ variables: { days: 7 } });
  });

  it('shows what the analysis found', () => {
    gql.analysis = { loading: false, data: { socialMediaInsights: 'Video beats text.' } };
    renderWithProviders(<AiInsightsPanel days={30} />);

    expect(screen.getByText('What the posts say')).toBeInTheDocument();
    expect(screen.getByText('Video beats text.')).toBeInTheDocument();
  });

  it('cannot run an analysis or ideas twice at once', () => {
    gql.analysis = { loading: true, data: undefined };
    gql.ideas = { loading: true, data: undefined };
    renderWithProviders(<AiInsightsPanel days={30} />);

    expect(screen.getByRole('button', { name: 'Analyse the last 30 days' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate ideas' })).toBeDisabled();
  });

  it('needs a topic before generating ideas', () => {
    renderWithProviders(<AiInsightsPanel days={30} />);
    expect(screen.getByRole('button', { name: 'Generate ideas' })).toBeDisabled();

    fill('Ideas about', '   ');
    expect(screen.getByRole('button', { name: 'Generate ideas' })).toBeDisabled();
  });

  it('generates five ideas on a topic by default, or as many as chosen', async () => {
    renderWithProviders(<AiInsightsPanel days={30} />);
    fill('Ideas about', 'AI agents for retail');

    await userEvent.click(screen.getByRole('button', { name: 'Generate ideas' }));
    expect(gql.ideate).toHaveBeenLastCalledWith({
      variables: { topic: 'AI agents for retail', count: 5 },
    });

    await chooseOption('How many', '10');
    await userEvent.click(screen.getByRole('button', { name: 'Generate ideas' }));
    expect(gql.ideate).toHaveBeenLastCalledWith({
      variables: { topic: 'AI agents for retail', count: 10 },
    });
  });

  it('shows the ideas it came back with', () => {
    gql.ideas = { loading: false, data: { socialMediaIdeas: '1. Store tour\n2. Demo day' } };
    renderWithProviders(<AiInsightsPanel days={30} />);

    expect(screen.getByText('Post ideas')).toBeInTheDocument();
    expect(screen.getByText(/Store tour/)).toBeInTheDocument();
  });

  it('logs and reports an AI request that failed', async () => {
    const failure = new Error('AI budget exhausted');
    gql.analyse.mockRejectedValue(failure);
    renderWithProviders(<AiInsightsPanel days={30} />);

    await userEvent.click(screen.getByRole('button', { name: 'Analyse the last 30 days' }));

    expect(await screen.findByText('AI budget exhausted')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith('An AI request failed', failure);
  });

  it('falls back to a plain message when the failure says nothing', async () => {
    gql.ideate.mockRejectedValue('timeout');
    renderWithProviders(<AiInsightsPanel days={30} />);
    fill('Ideas about', 'Launch week');

    await userEvent.click(screen.getByRole('button', { name: 'Generate ideas' }));

    await waitFor(() => expect(screen.getByText('The AI request failed')).toBeInTheDocument());
  });
});
