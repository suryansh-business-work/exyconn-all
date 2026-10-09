import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import * as fileUtils from '@/utils/file';
import {
  AttachmentList,
  AttachmentPicker,
  COMPLIANCE_UPLOAD_FOLDER,
  RhfAttachmentPicker,
  SUPPORT_UPLOAD_FOLDER,
  type AttachmentItem,
} from '@/components/upload';
import { renderWithProviders } from '../../test-utils';
import { FormHarness, formValues } from '../form/formHarness';
import { dataUrlOf, uploadMock } from '../ui/ImageUploadDialog/mediaHarness';

const PHOTO: AttachmentItem = {
  url: 'https://cdn.example.com/a.png',
  name: 'screen.png',
  contentType: 'image/png',
};
const PDF: AttachmentItem = {
  url: 'https://cdn.example.com/b.pdf',
  name: 'invoice.pdf',
  contentType: 'application/pdf',
};
const CDN = 'https://ik.imagekit.io/exyconn/support/report.pdf';

const pdfFile = () => new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
const pick = (file: File) =>
  fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });

function renderPicker(value: AttachmentItem[], mocks: MockLink.MockedResponse[] = []) {
  const onChange = vi.fn();
  renderWithProviders(
    <AttachmentPicker value={value} onChange={onChange} folder={SUPPORT_UPLOAD_FOLDER} />,
    { mocks },
  );
  return onChange;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('upload folders', () => {
  it('names the CDN namespaces every surface shares', () => {
    expect(SUPPORT_UPLOAD_FOLDER).toBe('support');
    expect(COMPLIANCE_UPLOAD_FOLDER).toBe('compliance');
  });
});

describe('AttachmentList', () => {
  it('shows a picture as a thumbnail and anything else as a named file link', () => {
    renderWithProviders(<AttachmentList items={[PHOTO, PDF]} />);

    expect(screen.getByRole('img', { name: 'screen.png' })).toHaveAttribute('src', PHOTO.url);
    const links = screen.getAllByRole('link');
    expect(links[1]).toHaveAttribute('href', PDF.url);
    expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByTestId('DescriptionIcon')).toBeInTheDocument();
  });

  it('renders nothing with no files', () => {
    const { container } = renderWithProviders(<AttachmentList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('AttachmentPicker', () => {
  it('opens the file picker for images and PDFs only', async () => {
    renderPicker([]);
    const input = screen.getByTestId('attachment-input');
    const click = vi.spyOn(input, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Attach file' }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('accept', 'image/*,application/pdf');
    expect(screen.getByText('Images or PDF · up to 5 MB')).toBeInTheDocument();
  });

  it('uploads a pick straight away and adds its URL to the list', async () => {
    let finish: (url: string) => void = () => undefined;
    vi.spyOn(fileUtils, 'fileToDataUrl').mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const onChange = renderPicker(
      [PHOTO],
      [
        uploadMock(
          { file: dataUrlOf('application/pdf', '%PDF'), fileName: 'report.pdf', folder: 'support' },
          { url: CDN },
        ),
      ],
    );

    pick(pdfFile());
    expect(await screen.findByRole('button', { name: 'Uploading…' })).toBeDisabled();
    finish(dataUrlOf('application/pdf', '%PDF'));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        PHOTO,
        { url: CDN, name: 'report.pdf', contentType: 'application/pdf' },
      ]),
    );
    expect(await screen.findByRole('button', { name: 'Attach file' })).toBeEnabled();
  });

  it('ignores a picker closed without a file', () => {
    const onChange = renderPicker([]);

    fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [] } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a file over the size limit before uploading', async () => {
    const onChange = renderPicker([]);
    const big = pdfFile();
    Object.defineProperty(big, 'size', { value: fileUtils.MAX_IMAGE_BYTES + 1 });

    pick(big);

    expect(await screen.findByText('A file must be 5 MB or smaller')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says so when the upload returns no URL, or fails', async () => {
    const variables = {
      file: dataUrlOf('application/pdf', '%PDF'),
      fileName: 'report.pdf',
      folder: 'support',
    };
    const onChange = renderPicker(
      [],
      [
        uploadMock(variables, { url: null }),
        uploadMock(variables, { error: new Error('CDN rejected the file') }),
      ],
    );

    pick(pdfFile());
    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
    pick(pdfFile());
    expect(await screen.findByText('CDN rejected the file')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    vi.spyOn(fileUtils, 'fileToDataUrl').mockRejectedValue('aborted');
    renderPicker([]);

    pick(pdfFile());

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('removes an attached file', async () => {
    const onChange = renderPicker([PHOTO, PDF]);

    const chip = screen.getByRole('button', { name: 'screen.png' });
    await userEvent.click(chip.querySelector('.MuiChip-deleteIcon'));

    expect(onChange).toHaveBeenCalledWith([PDF]);
  });
});

describe('RhfAttachmentPicker', () => {
  it('keeps the files in the form value', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ files: [PHOTO, PDF] }}>
        <RhfAttachmentPicker name="files" folder={COMPLIANCE_UPLOAD_FOLDER} />
      </FormHarness>,
    );

    const chip = screen.getByRole('button', { name: 'invoice.pdf' });
    await userEvent.click(chip.querySelector('.MuiChip-deleteIcon'));

    expect(formValues().files).toEqual([PHOTO]);
  });

  it('starts with no files when the form has none', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfAttachmentPicker name="files" folder={COMPLIANCE_UPLOAD_FOLDER} />
      </FormHarness>,
    );

    expect(screen.queryByRole('button', { name: /\.pdf|\.png/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument();
  });
});
