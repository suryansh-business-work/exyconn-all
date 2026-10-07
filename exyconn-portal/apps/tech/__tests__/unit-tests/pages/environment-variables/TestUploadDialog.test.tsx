import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_AVATAR_BYTES } from '@exyconn/shell/utils/file';
import { TestUploadDialog } from '../../../../src/pages/environment-variables/TestUploadDialog';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ upload: vi.fn(), toDataUrl: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTestImageUploadMutation: () => [gql.upload],
}));
vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  fileToDataUrl: gql.toDataUrl,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);

const DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';
const UPLOADED = 'https://ik.example.test/media/logo.png';
const onClose = vi.fn();

const renderDialog = () =>
  renderWithProviders(
    <TestUploadDialog configId="ik-1" configLabel="Media" open onClose={onClose} />,
  );

const input = () => screen.getByTestId<HTMLInputElement>('test-upload-input');

const choose = (files: File[]) => fireEvent.change(input(), { target: { files } });

const png = () => new File(['png-bytes'], 'logo.png', { type: 'image/png' });

describe('TestUploadDialog', () => {
  beforeEach(() => {
    resetHarness();
    onClose.mockReset();
    gql.upload.mockReset();
    gql.toDataUrl.mockReset();
    gql.toDataUrl.mockResolvedValue(DATA_URL);
  });

  it('names the configuration it uploads through and opens the file picker', async () => {
    renderDialog();
    expect(
      screen.getByText('Upload a file using the “Media” provider configuration.'),
    ).toBeInTheDocument();
    const click = vi.spyOn(input(), 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Choose file & upload' }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('uploads the chosen file through the config and previews the result', async () => {
    gql.upload.mockResolvedValue({ data: { testImageUpload: UPLOADED } });
    renderDialog();
    choose([png()]);
    expect(await screen.findByRole('img', { name: 'Uploaded preview' })).toHaveAttribute(
      'src',
      UPLOADED,
    );
    expect(screen.getByRole('link', { name: UPLOADED })).toHaveAttribute('href', UPLOADED);
    expect(gql.upload).toHaveBeenCalledWith({
      variables: { id: 'ik-1', file: DATA_URL, fileName: 'logo.png' },
    });
    expect(notify).toHaveBeenCalledWith('Test upload succeeded');
    expect(input().value).toBe('');
  });

  it('shows the upload in progress and locks the button until it finishes', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.upload.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderDialog();
    choose([png()]);
    const busy = await screen.findByRole('button', { name: 'Uploading…' });
    expect(busy).toBeDisabled();
    finish({ data: { testImageUpload: UPLOADED } });
    expect(await screen.findByRole('button', { name: 'Choose file & upload' })).toBeEnabled();
  });

  it('reports success without a preview when the API returns no address', async () => {
    gql.upload.mockResolvedValue({ data: null });
    renderDialog();
    choose([png()]);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Test upload succeeded'));
    expect(screen.queryByRole('img', { name: 'Uploaded preview' })).not.toBeInTheDocument();
  });

  it('refuses a file over 2 MB before uploading anything', () => {
    renderDialog();
    const big = png();
    Object.defineProperty(big, 'size', { value: MAX_AVATAR_BYTES + 1 });
    choose([big]);
    expect(notify).toHaveBeenCalledWith('File must be 2 MB or smaller', 'error');
    expect(gql.toDataUrl).not.toHaveBeenCalled();
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is dismissed without a file', () => {
    renderDialog();
    choose([]);
    expect(gql.toDataUrl).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([
    [new Error('ImageKit rejected the key'), 'ImageKit rejected the key'],
    ['offline', 'Upload failed'],
  ])('reports a failed upload (%s)', async (failure, message) => {
    gql.upload.mockRejectedValue(failure);
    renderDialog();
    choose([png()]);
    await waitFor(() => expect(notify).toHaveBeenCalledWith(message, 'error'));
    expect(screen.getByRole('button', { name: 'Choose file & upload' })).toBeEnabled();
  });

  it('clears the result and closes', async () => {
    gql.upload.mockResolvedValue({ data: { testImageUpload: UPLOADED } });
    renderDialog();
    choose([png()]);
    await screen.findByRole('img', { name: 'Uploaded preview' });
    const [closeIcon] = screen.getAllByRole('button', { name: 'Close' });
    await userEvent.click(closeIcon);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('img', { name: 'Uploaded preview' })).not.toBeInTheDocument();
  });
});
