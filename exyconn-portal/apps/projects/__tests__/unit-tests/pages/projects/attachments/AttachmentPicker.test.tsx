import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachmentPicker } from '../../../../../src/pages/projects/attachments';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadImageMutation: () => [gql.upload],
}));

const input = () => screen.getByTestId('attachment-input');

describe('AttachmentPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.upload.mockResolvedValue({ data: { uploadImage: 'https://ik.example/shot.png' } });
  });

  it('offers to attach a file, says what it accepts and only accepts that', () => {
    renderWithProviders(<AttachmentPicker onPicked={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Attach a file' })).toBeEnabled();
    expect(screen.getByText('Images or PDF · up to 5 MB each')).toBeInTheDocument();
    expect(input()).toHaveAttribute('accept', 'image/*,application/pdf');
  });

  it('takes its own label and can leave the help line out', () => {
    renderWithProviders(
      <AttachmentPicker label="Add a screenshot" showHelp={false} onPicked={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Add a screenshot' })).toBeInTheDocument();
    expect(screen.queryByText(/Images or PDF/)).not.toBeInTheDocument();
  });

  it('opens the file input from the button', async () => {
    renderWithProviders(<AttachmentPicker onPicked={vi.fn()} />);
    const click = vi.spyOn(input(), 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Attach a file' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('shows the upload in progress, then hands the uploaded file over', async () => {
    let finish: () => void = () => undefined;
    const onPicked = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(<AttachmentPicker onPicked={onPicked} />);
    const file = new File(['png'], 'shot.png', { type: 'image/png' });

    fireEvent.change(input(), { target: { files: [file] } });

    expect(await screen.findByRole('button', { name: 'Uploading…' })).toBeDisabled();
    await waitFor(() =>
      expect(onPicked).toHaveBeenCalledWith({
        url: 'https://ik.example/shot.png',
        name: 'shot.png',
        contentType: 'image/png',
      }),
    );
    expect(gql.upload).toHaveBeenCalledWith({
      variables: {
        file: expect.stringMatching(/^data:image\/png;base64,/),
        fileName: 'shot.png',
        folder: 'ticket-attachments',
      },
    });

    finish();
    expect(await screen.findByRole('button', { name: 'Attach a file' })).toBeEnabled();
  });
});
