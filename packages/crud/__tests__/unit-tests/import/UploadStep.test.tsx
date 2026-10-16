import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ParseTableFileDocument, TableFileFormat } from '@exyconn/shell/graphql/generated';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { MAX_FILE_BYTES } from '../../../src/import/importFile';
import { UploadStep } from '../../../src/import/steps/UploadStep';
import type { ImportFile } from '../../../src/import/import.types';
import { renderWithProviders } from '../test-utils';
import { csvFile, deferred, parseMock } from './importFixtures';

vi.mock('@exyconn/shell/utils/file', async (importActual) => {
  const actual = await importActual<typeof import('@exyconn/shell/utils/file')>();
  return { ...actual, fileToDataUrl: vi.fn(actual.fileToDataUrl) };
});

const renderUpload = (
  mocks: MockLink.MockedResponse[] = [],
  file: ImportFile | null = null,
  templateFormats: TableFileFormat[] = [TableFileFormat.Csv],
) => {
  const onFile = vi.fn();
  const onDownloadTemplate = vi.fn();
  renderWithProviders(
    <UploadStep
      file={file}
      onFile={onFile}
      templateFormats={templateFormats}
      onDownloadTemplate={onDownloadTemplate}
    />,
    { mocks },
  );
  return { onFile, onDownloadTemplate };
};

const input = () => screen.getByLabelText('Choose a CSV or Excel file');
const dropZone = () => screen.getByRole('button', { name: /Drop a CSV or Excel file here/ });

beforeEach(async () => {
  const actual = await vi.importActual<typeof import('@exyconn/shell/utils/file')>(
    '@exyconn/shell/utils/file',
  );
  vi.mocked(fileToDataUrl).mockImplementation(actual.fileToDataUrl);
});

describe('UploadStep', () => {
  it('reads a chosen file on the server and hands it on', async () => {
    const { onFile } = renderUpload([parseMock([['Acme', 'a@x.test', '']])]);
    await userEvent.upload(input(), csvFile());

    await vi.waitFor(() => expect(onFile).toHaveBeenCalledTimes(1));
    expect(onFile).toHaveBeenCalledWith({
      name: 'leads.csv',
      __typename: 'ParsedTableFile',
      headers: ['Organisation', 'Mail', 'Notes'],
      rows: [['Acme', 'a@x.test', '']],
    });
    // The picker is cleared, so the same file can be chosen again after a fix.
    expect(input()).toHaveValue('');
  });

  it('says "Reading…" and locks the drop zone while the file is read', async () => {
    const reading = deferred<string>();
    vi.mocked(fileToDataUrl).mockReturnValueOnce(reading.promise);
    renderUpload();
    await userEvent.upload(input(), csvFile());

    expect(screen.getByText('Reading…')).toBeInTheDocument();
    expect(dropZone()).toBeDisabled();
    reading.reject(new Error('The file is locked.'));
    expect(await screen.findByText('The file is locked.')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('refuses a file over 10 MB before sending it', async () => {
    const { onFile } = renderUpload();
    const big = csvFile('huge.csv');
    Object.defineProperty(big, 'size', { value: MAX_FILE_BYTES + 1 });
    await userEvent.upload(input(), big);

    expect(
      await screen.findByText('huge.csv is larger than 10 MB. Split it into smaller files.'),
    ).toBeInTheDocument();
    expect(fileToDataUrl).not.toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("shows the server's reason when it refuses the file", async () => {
    const refused: MockLink.MockedResponse = {
      request: { query: ParseTableFileDocument, variables: () => true },
      result: { errors: [{ message: 'The first line must name the columns.' }] },
    };
    const { onFile } = renderUpload([refused]);
    await userEvent.upload(input(), csvFile());

    expect(await screen.findByText('The first line must name the columns.')).toBeInTheDocument();
    expect(onFile).not.toHaveBeenCalled();
  });

  it('says the file could not be read when the server answers with no data', async () => {
    const empty: MockLink.MockedResponse = {
      request: { query: ParseTableFileDocument, variables: () => true },
      result: { data: null },
    };
    renderUpload([empty]);
    await userEvent.upload(input(), csvFile());

    expect(await screen.findByText('The file could not be read.')).toBeInTheDocument();
  });

  it('takes a dropped file and highlights the zone while dragging over it', async () => {
    const { onFile } = renderUpload([parseMock([['Acme', 'a@x.test', '']])]);
    fireEvent.dragOver(dropZone());
    expect(dropZone()).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(dropZone());
    expect(dropZone()).toHaveAttribute('data-dragging', 'false');

    fireEvent.dragOver(dropZone());
    fireEvent.drop(dropZone(), { dataTransfer: { files: [csvFile()] } });
    expect(dropZone()).toHaveAttribute('data-dragging', 'false');
    await vi.waitFor(() => expect(onFile).toHaveBeenCalledTimes(1));
  });

  it('ignores a drop or a change that carries no file', () => {
    renderUpload();
    fireEvent.drop(dropZone(), { dataTransfer: { files: [] } });
    fireEvent.change(input(), { target: { files: [] } });

    expect(fileToDataUrl).not.toHaveBeenCalled();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('opens the file picker from the drop zone', async () => {
    renderUpload();
    const pick = vi.spyOn(input(), 'click');
    await userEvent.click(dropZone());
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it('confirms the file it has, and offers each sample format', async () => {
    const { onDownloadTemplate } = renderUpload(
      [],
      { name: 'leads.xlsx', headers: ['Name'], rows: [['A'], ['B']] },
      [TableFileFormat.Csv, TableFileFormat.Xlsx],
    );
    expect(screen.getByText('leads.xlsx: 2 rows ready to map.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Download sample Excel' }));
    expect(onDownloadTemplate).toHaveBeenCalledWith(TableFileFormat.Xlsx);
  });
});
