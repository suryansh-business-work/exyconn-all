import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildOrgTree, type OrgTreeNode } from '../../../../src/pages/org-chart';
import { OrgNodeCard } from '../../../../src/pages/org-chart/OrgNodeCard';
import { renderWithProviders } from '../../test-utils';
import { COMPANY } from './org-people';

function renderCard(node: OrgTreeNode = buildOrgTree(COMPANY).trees[0], depth = 0) {
  const onOpen = vi.fn();
  renderWithProviders(<OrgNodeCard node={node} depth={depth} onOpen={onOpen} />);
  return { onOpen };
}

describe('OrgNodeCard', () => {
  it('shows the manager with their role, initials and the size of their whole team', () => {
    renderCard();

    expect(screen.getByText('Maya Iyer')).toBeInTheDocument();
    expect(screen.getByText('CEO · Leadership')).toBeInTheDocument();
    expect(screen.getByText('MI')).toBeInTheDocument();
    expect(screen.getByText('3 in team')).toBeInTheDocument();
  });

  it('opens the first two levels and folds deeper teams away', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'collapse Maya Iyer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'collapse Asha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'expand Chen' })).toBeInTheDocument();
    expect(screen.queryByText('Dev')).not.toBeInTheDocument();
  });

  it('expands a folded team and collapses an open one', async () => {
    renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'expand Chen' }));
    expect(await screen.findByText('Dev')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'collapse Chen' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'collapse Maya Iyer' }));
    await waitFor(() => expect(screen.queryByText('Asha')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'expand Maya Iyer' })).toBeInTheDocument();
  });

  it('starts a team below the default depth folded', () => {
    const asha = buildOrgTree(COMPANY).trees[0].reports[0];
    renderCard(asha, 2);

    expect(screen.getByRole('button', { name: 'expand Asha' })).toBeInTheDocument();
    expect(screen.queryByText('Chen')).not.toBeInTheDocument();
  });

  it('gives somebody with no reports no toggle, no team chip and a dash for a role', () => {
    const omar = buildOrgTree(COMPANY).unplaced[0];
    renderCard(omar);

    expect(screen.getByText('Omar')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand|collapse/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/in team/)).not.toBeInTheDocument();
  });

  it('shows the photo of somebody who has one', () => {
    renderCard();

    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      'https://img.example.com/asha.png',
    );
  });

  it('opens whichever person in the tree was clicked', async () => {
    const { onOpen } = renderCard();

    await userEvent.click(screen.getByText('Chen'));
    await userEvent.click(screen.getByText('Maya Iyer'));

    expect(onOpen.mock.calls).toEqual([['c'], ['m']]);
  });
});
