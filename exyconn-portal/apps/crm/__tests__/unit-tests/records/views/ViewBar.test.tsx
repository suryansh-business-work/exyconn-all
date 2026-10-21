import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import type { RecordQuery } from '../../../../src/records/list/useRecordQuery';
import { saveViewSchema } from '../../../../src/records/views/save-view';
import { ViewBar } from '../../../../src/records/views/ViewBar';
import { renderWithProviders } from '../../test-utils';
import { crmView } from '../records-fixtures';

const actions = vi.hoisted(() => ({
  saveOver: vi.fn(),
  saveAsNew: vi.fn(),
  changeDetails: vi.fn(),
  remove: vi.fn(),
  busy: false,
  logError: vi.fn(),
}));

vi.mock('../../../../src/records/views/useViewActions', () => ({
  useViewActions: () => actions,
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: (...args: unknown[]) => actions.logError(...args) },
}));

const MINE = crmView();
const SHARED_MINE = crmView({ id: 'view-2', name: 'Team pipeline', shared: true });
const THEIRS = crmView({
  id: 'view-3',
  name: 'Ravi’s list',
  mine: false,
  shared: true,
  ownerName: 'Ravi',
});
const ALL = [MINE, SHARED_MINE, THEIRS];

function listOf(overrides: Partial<RecordQuery> = {}) {
  return {
    views: ALL,
    selectedView: null,
    viewId: '',
    dirty: false,
    viewsError: undefined,
    chooseView: vi.fn(),
    ...overrides,
  } as unknown as RecordQuery;
}

function renderBar(list: RecordQuery) {
  renderWithProviders(<ViewBar object={CrmObject.Lead} list={list} allLabel="All leads" />);
  return list;
}

describe('ViewBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actions.busy = false;
    actions.saveOver.mockResolvedValue(undefined);
    actions.saveAsNew.mockResolvedValue(true);
    actions.changeDetails.mockResolvedValue(true);
    actions.remove.mockResolvedValue(undefined);
  });

  it('lists the default view and the saved views, marking the open one', async () => {
    const list = renderBar(listOf());
    const group = screen.getByRole('group', { name: 'Saved views' });
    const chips = within(group).getAllByRole('button', { pressed: false });
    expect(within(group).getByRole('button', { name: 'All leads' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(chips.map((chip) => chip.textContent)).toEqual([
      'Hot leads',
      'Team pipeline',
      'Ravi’s list',
    ]);
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Options for view/ })).not.toBeInTheDocument();

    await userEvent.click(within(group).getByRole('button', { name: 'Team pipeline' }));
    expect(list.chooseView).toHaveBeenCalledWith('view-2');
    await userEvent.click(within(group).getByRole('button', { name: 'All leads' }));
    expect(list.chooseView).toHaveBeenCalledWith('');
  });

  it('says who shared a team view, keeping the view name as the chip name', () => {
    renderBar(listOf());
    expect(screen.getByRole('button', { name: 'Ravi’s list' })).toHaveAccessibleDescription(
      'Shared by Ravi',
    );
    expect(screen.getByRole('button', { name: 'Team pipeline' })).toHaveAccessibleDescription(
      'Shared with the team',
    );
    expect(screen.getByRole('button', { name: 'Hot leads' })).not.toHaveAccessibleDescription();
  });

  it('warns when the views could not be loaded', () => {
    renderBar(listOf({ viewsError: new Error('x') } as Partial<RecordQuery>));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the saved views. Try again shortly.',
    );
  });

  it('saves unsaved changes over the viewer’s own open view', async () => {
    renderBar(listOf({ selectedView: MINE, viewId: 'view-1', dirty: true }));
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save view' }));
    expect(actions.saveOver).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs a save over that failed unexpectedly', async () => {
    const failure = new Error('boom');
    actions.saveOver.mockRejectedValue(failure);
    renderBar(listOf({ selectedView: MINE, viewId: 'view-1', dirty: true }));
    await userEvent.click(screen.getByRole('button', { name: 'Save view' }));
    await waitFor(() =>
      expect(actions.logError).toHaveBeenCalledWith('Saving a view failed', failure),
    );
  });

  it('saves changes to someone else’s view as a new view', async () => {
    renderBar(listOf({ selectedView: THEIRS, viewId: 'view-3', dirty: true }));
    expect(screen.queryByRole('button', { name: /Options for view/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save view' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save as new view' });
    expect(actions.saveOver).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText(/^View name\s*\*?$/), 'My copy');
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Share with the team' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(actions.saveAsNew).toHaveBeenCalledWith({ name: 'My copy', shared: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('checks the new view name and keeps the dialog open when saving failed', async () => {
    actions.saveAsNew.mockResolvedValue(false);
    renderBar(listOf());
    await userEvent.click(screen.getByRole('button', { name: 'Save as new view' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save as new view' });
    expect(
      within(dialog).getByText('Up to 60 characters, e.g. Hot leads this month'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Give the view a name')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText(/^View name\s*\*?$/), 'Kept');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(actions.saveAsNew).toHaveBeenCalled());
    expect(screen.getByRole('dialog', { name: 'Save as new view' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('disables saving while a change is on its way', () => {
    actions.busy = true;
    renderBar(listOf({ selectedView: MINE, viewId: 'view-1', dirty: true }));
    expect(screen.getByRole('button', { name: 'Save view' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save as new view' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Options for view Hot leads' })).toBeDisabled();
  });

  it('caps a view name at 60 characters', () => {
    expect(
      saveViewSchema.safeParse({ name: 'x'.repeat(61), shared: false }).error?.issues[0].message,
    ).toBe('A view name is at most 60 characters');
  });
});

describe('ViewMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actions.busy = false;
    actions.changeDetails.mockResolvedValue(true);
    actions.remove.mockResolvedValue(undefined);
  });

  async function openMenu(view = MINE) {
    renderBar(listOf({ selectedView: view, viewId: view.id }));
    await userEvent.click(screen.getByRole('button', { name: `Options for view ${view.name}` }));
    return screen.findByRole('menu');
  }

  it('renames the view through the edit dialog', async () => {
    const menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit view' });
    const name = within(dialog).getByLabelText(/^View name\s*\*?$/);
    expect(name).toHaveValue('Hot leads');
    await userEvent.clear(name);
    await userEvent.type(name, 'Hotter leads');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(actions.changeDetails).toHaveBeenCalledWith(MINE, {
        name: 'Hotter leads',
        shared: false,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shares a private view and stops sharing a shared one', async () => {
    let menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Share with the team' }));
    expect(actions.changeDetails).toHaveBeenCalledWith(MINE, { name: 'Hot leads', shared: true });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    document.body.innerHTML = '';
    menu = await openMenu(SHARED_MINE);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Stop sharing' }));
    expect(actions.changeDetails).toHaveBeenLastCalledWith(SHARED_MINE, {
      name: 'Team pipeline',
      shared: false,
    });
  });

  it('deletes the view', async () => {
    const menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    expect(actions.remove).toHaveBeenCalledWith(MINE);
  });

  it('logs failures the actions did not handle', async () => {
    const failure = new Error('boom');
    actions.changeDetails.mockRejectedValue(failure);
    actions.remove.mockRejectedValue(failure);
    let menu = await openMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Share with the team' }));
    await waitFor(() =>
      expect(actions.logError).toHaveBeenCalledWith('Changing who sees a view failed', failure),
    );
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Options for view Hot leads' }));
    menu = await screen.findByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() =>
      expect(actions.logError).toHaveBeenCalledWith('Deleting a view failed', failure),
    );
  });

  it('closes on Escape without doing anything', async () => {
    await openMenu();
    expect(
      screen.getByRole('button', { name: 'Options for view Hot leads', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(actions.changeDetails).not.toHaveBeenCalled();
  });
});
