import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMediaActions } from '../../../../../src/pages/cms/media/useMediaActions';
import { mediaAsset } from './media.fixtures';

const spies = vi.hoisted(() => ({
  deleteAsset: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  copy: vi.fn(),
  reload: vi.fn(),
  editAlt: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteCmsAssetMutation: () => [spies.deleteAsset],
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => spies.confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));
vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: spies.copy }));

const asset = mediaAsset();
const actions = () => renderHook(() => useMediaActions(spies.reload, spies.editAlt)).result.current;

describe('useMediaActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.copy.mockResolvedValue(true);
    spies.confirm.mockResolvedValue(true);
    spies.deleteAsset.mockResolvedValue({ data: {} });
    spies.reload.mockResolvedValue(undefined);
  });

  it("copies the file's URL and says so", async () => {
    actions().onCopy(asset);

    expect(spies.copy).toHaveBeenCalledWith(asset.url);
    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('URL copied', 'success'));
  });

  it('says when the browser would not copy', async () => {
    spies.copy.mockResolvedValueOnce(false);
    actions().onCopy(asset);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not copy the URL', 'error'),
    );
  });

  it('reports a copy that threw', async () => {
    spies.copy.mockRejectedValueOnce('denied');
    actions().onCopy(asset);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not copy the URL', 'error'),
    );
  });

  it('hands alt text editing to the library', () => {
    actions().onEditAlt(asset);
    expect(spies.editAlt).toHaveBeenCalledWith(asset);
  });

  it('deletes a file after warning about broken images, then reloads', async () => {
    actions().onDelete(asset);

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.confirm).toHaveBeenCalledWith({
      message: 'Delete {name}? Pages that show it will show a broken image.',
      messageValues: { name: 'logo.png' },
      confirmText: 'Delete',
      destructive: true,
    });
    expect(spies.deleteAsset).toHaveBeenCalledWith({ variables: { id: 'asset-1' } });
    expect(spies.notify).toHaveBeenCalledWith('File deleted', 'success');
  });

  it('keeps the file when the warning is declined', async () => {
    spies.confirm.mockResolvedValueOnce(false);
    actions().onDelete(asset);

    await waitFor(() => expect(spies.confirm).toHaveBeenCalled());
    expect(spies.deleteAsset).not.toHaveBeenCalled();
    expect(spies.reload).not.toHaveBeenCalled();
  });

  it('says why a delete failed, or that it did', async () => {
    spies.deleteAsset.mockRejectedValueOnce(new Error('File is in use'));
    actions().onDelete(asset);
    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('File is in use', 'error'));

    spies.deleteAsset.mockRejectedValueOnce('offline');
    actions().onDelete(asset);
    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('Delete failed', 'error'));
    expect(spies.reload).not.toHaveBeenCalled();
  });
});
