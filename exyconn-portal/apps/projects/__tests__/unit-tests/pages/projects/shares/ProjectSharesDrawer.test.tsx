import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSharesDrawer } from '../../../../../src/pages/projects/shares';
import { renderWithProviders } from '../../../test-utils';
import { shareFixture } from '../projects-fixtures';

const hook = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  projectId: '',
  forget: vi.fn(),
  copyNewUrl: vi.fn(),
  onCreated: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock('../../../../../src/pages/projects/shares/useProjectShares', () => ({
  useProjectShares: (projectId: string) => {
    hook.projectId = projectId;
    return hook.state;
  },
}));

vi.mock('../../../../../src/pages/projects/forms/share', () => ({
  ShareForm: ({
    projectId,
    onCreated,
    onCancel,
  }: Readonly<{ projectId: string; onCreated: (url: string) => void; onCancel: () => void }>) => (
    <div>
      <p>{`Share form for ${projectId}`}</p>
      <button type="button" onClick={() => onCreated('https://share.test/new')}>
        Create link
      </button>
      <button type="button" onClick={onCancel}>
        Cancel share
      </button>
    </div>
  ),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));

const PROJECT = { id: 'proj-1', name: 'Website' };

function setState(overrides: Record<string, unknown> = {}) {
  hook.state = {
    shares: [],
    loading: false,
    newUrl: '',
    onCreated: hook.onCreated,
    forget: hook.forget,
    copyNewUrl: hook.copyNewUrl,
    revoke: hook.revoke,
    ...overrides,
  };
}

describe('ProjectSharesDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setState();
  });

  it('stays closed with no project, and loads no project links', () => {
    renderWithProviders(<ProjectSharesDrawer project={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: /Share/ })).not.toBeInTheDocument();
    expect(hook.projectId).toBe('');
  });

  it('opens on a project with the share form and says when it has no links', () => {
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Share "Website"' })).toBeInTheDocument();
    expect(hook.projectId).toBe('proj-1');
    expect(screen.getByText('Share form for proj-1')).toBeInTheDocument();
    expect(screen.getByText('Links (0)')).toBeInTheDocument();
    expect(screen.getByText('No links have been issued for this project.')).toBeInTheDocument();
  });

  it('hands a created link to the hook', async () => {
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create link' }));

    expect(hook.onCreated).toHaveBeenCalledWith('https://share.test/new');
  });

  it('shows a spinner, not the empty line, while the first list loads', () => {
    setState({ loading: true });
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByText('No links have been issued for this project.'),
    ).not.toBeInTheDocument();
  });

  it('lists each link with its expiry in the viewer format and revokes through the hook', async () => {
    const share = shareFixture();
    setState({ shares: [share, shareFixture({ id: 'share-2', label: 'Old', isLive: false })] });
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={vi.fn()} />);

    expect(screen.getByText('Links (2)')).toBeInTheDocument();
    expect(screen.getByText('Old')).toBeInTheDocument();
    expect(
      screen.getAllByText('Expires on 2026-11-01T00:00:00.000Z · created by Asha Rao'),
    ).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(hook.revoke).toHaveBeenCalledWith(share);
  });

  it('shows a new link once, with copy and a dismiss that keeps the drawer open', async () => {
    const onClose = vi.fn();
    setState({ newUrl: 'https://share.test/once' });
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={onClose} />);

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('https://share.test/once')).toBeInTheDocument();
    expect(
      within(alert).getByText('Copy this link now — it is not stored and cannot be shown again.'),
    ).toBeInTheDocument();
    await userEvent.click(within(alert).getByRole('button', { name: 'Copy link' }));
    expect(hook.copyNewUrl).toHaveBeenCalledTimes(1);

    await userEvent.click(within(alert).getByRole('button', { name: 'Close' }));
    expect(hook.forget).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('forgets the one-time link whenever the drawer is closed or the form cancelled', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ProjectSharesDrawer project={PROJECT} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel share' }));
    expect(hook.forget).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(hook.forget).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
