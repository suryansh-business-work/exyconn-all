import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMakeDefaultSite } from '../../../../../src/pages/cms/websites/useMakeDefaultSite';

const spies = vi.hoisted(() => ({
  setDefault: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetDefaultCmsSiteMutation: () => [spies.setDefault],
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => spies.confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const blog = { id: 'site-2', name: 'Blog' };
const makeDefault = () => renderHook(() => useMakeDefaultSite(spies.reload)).result.current;

describe('useMakeDefaultSite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.confirm.mockResolvedValue(true);
    spies.setDefault.mockResolvedValue({ data: {} });
    spies.reload.mockResolvedValue(undefined);
  });

  it('asks, makes the site the default, reloads, then says so', async () => {
    makeDefault()(blog);

    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('{name} is now the default website', 'success', {
        name: 'Blog',
      }),
    );
    expect(spies.confirm).toHaveBeenCalledWith({
      title: 'Make {name} the default website?',
      titleValues: { name: 'Blog' },
      message: 'Hosts no website claims, and local previews, will show this site.',
      confirmText: 'Make default',
    });
    expect(spies.setDefault).toHaveBeenCalledWith({ variables: { id: 'site-2' } });
    expect(spies.reload).toHaveBeenCalledTimes(1);
  });

  it('changes nothing when the question is declined', async () => {
    spies.confirm.mockResolvedValueOnce(false);
    makeDefault()(blog);

    await waitFor(() => expect(spies.confirm).toHaveBeenCalled());
    expect(spies.setDefault).not.toHaveBeenCalled();
    expect(spies.notify).not.toHaveBeenCalled();
  });

  it('says why the default could not change, or that it could not', async () => {
    spies.setDefault.mockRejectedValueOnce(new Error('Site is a draft'));
    makeDefault()(blog);
    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('Site is a draft', 'error'));

    spies.setDefault.mockRejectedValueOnce('offline');
    makeDefault()(blog);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not change the default', 'error'),
    );
    expect(spies.reload).not.toHaveBeenCalled();
  });
});
