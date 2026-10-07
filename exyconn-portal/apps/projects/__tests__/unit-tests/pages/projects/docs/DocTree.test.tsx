import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocTree } from '../../../../../src/pages/projects/docs/DocTree';
import { buildDocTree } from '../../../../../src/pages/projects/docs/doc-tree';
import { renderWithProviders } from '../../../test-utils';
import { docPage } from '../../../fixtures';
import { DndWrapper } from '../board/dnd-wrapper';

const PAGES = [
  docPage('runbooks', null, 'Runbooks'),
  docPage('releasing', 'runbooks', 'Releasing'),
  docPage('decisions', null, 'Decisions'),
];

const renderTree = (selectedId: string | null = null) => {
  const onSelect = vi.fn();
  const onAddChild = vi.fn();
  renderWithProviders(
    <DndWrapper ids={PAGES.map((page) => page.id)}>
      <DocTree
        nodes={buildDocTree(PAGES)}
        selectedId={selectedId}
        onSelect={onSelect}
        onAddChild={onAddChild}
      />
    </DndWrapper>,
  );
  return { onSelect, onAddChild };
};

describe('DocTree', () => {
  it('lists every page with its branches open', () => {
    renderTree();

    expect(screen.getByText('Runbooks')).toBeInTheDocument();
    expect(screen.getByText('Releasing')).toBeInTheDocument();
    expect(screen.getByText('Decisions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Runbooks' })).toBeEnabled();
  });

  it('folds a branch away and opens it again', async () => {
    renderTree();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse Runbooks' }));
    await waitFor(() => expect(screen.queryByText('Releasing')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Expand Runbooks' }));
    expect(await screen.findByText('Releasing')).toBeInTheDocument();
  });

  it('cannot fold a page with nothing under it', () => {
    renderTree();

    expect(screen.getByRole('button', { name: 'Collapse Decisions', hidden: true })).toBeDisabled();
  });

  it('opens a page when its row is clicked, at any depth', async () => {
    const { onSelect } = renderTree();

    await userEvent.click(screen.getByText('Releasing'));
    await userEvent.click(screen.getByText('Decisions'));

    expect(onSelect.mock.calls).toEqual([['releasing'], ['decisions']]);
  });

  it('marks the open page', () => {
    renderTree('releasing');

    expect(screen.getByText('Releasing').closest('.Mui-selected')).not.toBeNull();
    expect(screen.getByText('Runbooks').closest('.Mui-selected')).toBeNull();
  });

  it('files a new page under the row whose + was pressed', async () => {
    const { onAddChild } = renderTree();

    await userEvent.click(screen.getByRole('button', { name: 'Add a page under Releasing' }));

    expect(onAddChild).toHaveBeenCalledWith('releasing');
  });

  it('gives every row a grip that names the page it moves', () => {
    renderTree();

    expect(screen.getByRole('button', { name: 'Move Runbooks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Releasing' })).toBeInTheDocument();
  });
});
