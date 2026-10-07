import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { SonarIssuesTable } from '../../../../../src/pages/security/sonar/SonarIssuesTable';
import { issue, overview } from '../../../../../src/pages/security/sonar/SonarPage.fixtures';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ issues: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSonarIssuesQuery: gql.issues,
}));

const OVERVIEW = overview(SonarOverviewState.Ok).sonarOverview;

const renderTable = () => renderWithProviders(<SonarIssuesTable overview={OVERVIEW} />);
const filter = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('SonarIssuesTable', () => {
  beforeEach(() => {
    gql.issues.mockReset().mockReturnValue({ data: undefined, loading: false });
  });

  it('starts on the overview’s own list without asking SonarQube again', () => {
    renderTable();
    expect(screen.getByRole('heading', { name: 'Open issues (41)' })).toBeInTheDocument();
    expect(gql.issues).toHaveBeenLastCalledWith({ variables: { severity: 'ALL' }, skip: true });
    expect(screen.getByText('Extract this nested ternary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers only the severities that have issues', () => {
    renderTable();
    expect(screen.getByRole('button', { name: 'MAJOR (30)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MINOR (11)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /INFO/ })).not.toBeInTheDocument();
  });

  it('asks SonarQube for the worst page of one severity', async () => {
    gql.issues.mockImplementation(({ skip }: { skip: boolean }) => ({
      data: skip ? undefined : { sonarIssues: [issue('I9', 'MINOR', 'Remove this unused import')] },
      loading: false,
    }));
    renderTable();
    await filter('MINOR (11)');
    expect(gql.issues).toHaveBeenLastCalledWith({ variables: { severity: 'MINOR' }, skip: false });
    expect(await screen.findByText('Remove this unused import')).toBeInTheDocument();
    expect(screen.queryByText('Extract this nested ternary')).not.toBeInTheDocument();
  });

  it('goes back to every severity when the chosen one is clicked again', async () => {
    renderTable();
    await filter('MAJOR (30)');
    expect(screen.getByRole('button', { name: 'MAJOR (30)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await filter('MAJOR (30)');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(gql.issues).toHaveBeenLastCalledWith({ variables: { severity: 'ALL' }, skip: true });
  });

  it('holds placeholder rows while a severity loads', async () => {
    gql.issues.mockImplementation(({ skip }: { skip: boolean }) => ({
      data: undefined,
      loading: !skip,
    }));
    const { container } = renderTable();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
    await filter('MAJOR (30)');
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('says when a severity has no open issue', async () => {
    renderTable();
    await filter('MAJOR (30)');
    expect(screen.getByText('No open issues at this severity.')).toBeInTheDocument();
  });

  it('says why a severity could not be read', async () => {
    gql.issues.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Rate limited'),
    });
    const { unmount } = renderTable();
    expect(screen.getByRole('alert')).toHaveTextContent('Rate limited');
    unmount();
    gql.issues.mockReturnValue({ data: undefined, loading: false, error: { message: 'x' } });
    renderTable();
    expect(screen.getByRole('alert')).toHaveTextContent('These issues could not be read.');
  });
});
