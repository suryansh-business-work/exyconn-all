import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { SharedProjectPage } from '../../../../src/pages/project';
import { renderWithProviders } from '../../test-utils';
import { TOKEN, projectLookup, sharedProject } from './project.fixtures';

const EXPIRED = 'This link no longer works';

function renderProject(
  mocks: MockLink.MockedResponse[],
  route = `/project/${TOKEN}`,
  path = '/project/:token',
) {
  renderWithProviders(<SharedProjectPage />, { mocks, route, path });
}

/** A fact card's value, found from its label. */
const fact = (label: string) => screen.getByText(label).closest('.MuiCard-root') as HTMLElement;

describe('SharedProjectPage', () => {
  it('loads, then shows the project, its client and the read-only warning', async () => {
    renderProject([projectLookup(sharedProject())]);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Website relaunch' })).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Where this project has got to.')).toBeInTheDocument();
    expect(screen.getByText('Shared read-only view.')).toBeInTheDocument();
    expect(screen.getByText('Design sign-off')).toBeInTheDocument();
  });

  it('sets out status, dates and hours against the budget', async () => {
    renderProject([projectLookup(sharedProject())]);
    await screen.findByRole('heading', { name: 'Website relaunch' });

    expect(within(fact('Status')).getByText('ON HOLD')).toBeInTheDocument();
    expect(within(fact('Started')).getByText('1 Jan 2026')).toBeInTheDocument();
    expect(within(fact('Target end')).getByText('—')).toBeInTheDocument();
    expect(within(fact('Hours tracked')).getByText('12.5 h of 40 h')).toBeInTheDocument();
  });

  it('shows just the hours, and no client chip, when neither was set', async () => {
    renderProject([
      projectLookup(
        sharedProject({
          budgetHours: null,
          clientName: '',
          startDate: null,
          endDate: '2026-06-30',
        }),
      ),
    ]);
    await screen.findByRole('heading', { name: 'Website relaunch' });

    expect(within(fact('Hours tracked')).getByText('12.5 h')).toBeInTheDocument();
    expect(within(fact('Started')).getByText('—')).toBeInTheDocument();
    expect(within(fact('Target end')).getByText('30 Jun 2026')).toBeInTheDocument();
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
  });

  it('says the link no longer works when the server shares nothing', async () => {
    renderProject([projectLookup(null)]);
    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    expect(
      screen.getByText(
        'It has expired, been revoked, or was never valid. Ask whoever sent it for a new one.',
      ),
    ).toBeInTheDocument();
  });

  it('does not ask the server when the link carries no token', () => {
    renderProject([], '/project', '/project');
    expect(screen.getByText(EXPIRED)).toBeInTheDocument();
  });
});
