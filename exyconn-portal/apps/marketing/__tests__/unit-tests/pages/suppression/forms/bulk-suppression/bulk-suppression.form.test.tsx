import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import { BulkSuppressionForm } from '../../../../../../src/pages/suppression/forms/bulk-suppression';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddMarketingSuppressionsMutation: () => [gql.add],
}));

function renderBulk() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const { container } = renderWithProviders(
    <BulkSuppressionForm onDone={onDone} onCancel={onCancel} />,
  );
  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!fileInput) {
    throw new Error('The CSV file input is missing');
  }
  return { onDone, onCancel, fileInput };
}

/** `count` distinct valid addresses, one per line. */
const manyAddresses = (count: number) =>
  Array.from({ length: count }, (_, index) => `user${index}@acme.io`).join('\n');

const preview = () => screen.getByRole('status');

describe('BulkSuppressionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.add.mockResolvedValue({
      data: {
        addMarketingSuppressions: {
          added: ['a@acme.io'],
          alreadySuppressed: ['b@acme.io'],
          invalid: [],
        },
      },
    });
  });

  it('starts empty with an informational preview', () => {
    renderBulk();

    expect(preview()).toHaveTextContent('0 valid unique address(es), 0 invalid, 0 repeated.');
    expect(preview().className).toMatch(/Info/);
    expect(screen.getByText('Choose a CSV file')).toBeInTheDocument();
  });

  it('previews valid, invalid and repeated addresses as they are pasted', () => {
    renderBulk();

    fill('Addresses', 'a@acme.io, A@acme.io\nbroken@\nb@acme.io');

    expect(preview()).toHaveTextContent('2 valid unique address(es), 1 invalid, 1 repeated.');
    expect(preview().className).toMatch(/Warning/);
  });

  it('asks for addresses when nothing was pasted', async () => {
    renderBulk();

    await press('Suppress addresses');

    expect(
      await screen.findByText('Paste some addresses or choose a CSV file'),
    ).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('refuses text with no valid address in it', async () => {
    renderBulk();
    fill('Addresses', 'no addresses here, broken@');

    await press('Suppress addresses');

    expect(await screen.findByText('Add between 1 and 5000 valid addresses')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('refuses more addresses than the server takes at once', async () => {
    renderBulk();
    fill('Addresses', manyAddresses(5001));

    await press('Suppress addresses');

    expect(await screen.findByText('Add between 1 and 5000 valid addresses')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('sends exactly the server limit', async () => {
    const { onDone } = renderBulk();
    fill('Addresses', manyAddresses(5000));

    await press('Suppress addresses');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.add.mock.calls[0][0].variables.input.emails).toHaveLength(5000);
  });

  it('sends the unique valid addresses with the reason and note, then reports the outcome', async () => {
    const { onDone } = renderBulk();
    fill('Addresses', 'A@acme.io\nb@acme.io\na@acme.io\nbroken@');
    await chooseOption('Reason', 'Hard bounce');
    fill('Internal note', ' from the old ESP ');

    await press('Suppress addresses');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.add).toHaveBeenCalledWith({
      variables: {
        input: {
          emails: ['a@acme.io', 'b@acme.io'],
          reason: SuppressionReason.Bounced,
          note: 'from the old ESP',
          fromFile: false,
        },
      },
    });
    expect(await screen.findByText('1 added, 1 already suppressed, 0 invalid')).toBeInTheDocument();
  });

  it('reads the addresses from a chosen CSV file and marks the add as an import', async () => {
    const { onDone, fileInput } = renderBulk();
    const csv = new File(['name,email\nAda,ada@acme.io\nGrace,grace@navy.mil'], 'list.csv', {
      type: 'text/csv',
    });

    await userEvent.upload(fileInput, csv);

    await waitFor(() =>
      expect(screen.getByLabelText(/^Addresses\s*\*?$/)).toHaveValue(
        'name,email\nAda,ada@acme.io\nGrace,grace@navy.mil',
      ),
    );
    expect(preview()).toHaveTextContent('2 valid unique address(es), 0 invalid, 0 repeated.');

    await press('Suppress addresses');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.add.mock.calls[0][0].variables.input).toMatchObject({
      emails: ['ada@acme.io', 'grace@navy.mil'],
      fromFile: true,
    });
  });

  it('leaves the addresses alone when the file picker is dismissed', () => {
    const { fileInput } = renderBulk();
    fill('Addresses', 'a@acme.io');

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(screen.getByLabelText(/^Addresses\s*\*?$/)).toHaveValue('a@acme.io');
  });

  it('reports zero counts when the server answers without a result', async () => {
    gql.add.mockResolvedValue({ data: null });
    const { onDone } = renderBulk();
    fill('Addresses', 'a@acme.io');

    await press('Suppress addresses');

    expect(await screen.findByText('0 added, 0 already suppressed, 0 invalid')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('shows the server error and stays open when adding fails', async () => {
    gql.add.mockRejectedValue(new Error('Too many addresses today'));
    const { onDone } = renderBulk();
    fill('Addresses', 'a@acme.io');

    await press('Suppress addresses');

    expect(await screen.findByText('Too many addresses today')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.add.mockRejectedValue('offline');
    renderBulk();
    fill('Addresses', 'a@acme.io');

    await press('Suppress addresses');

    expect(await screen.findByText('The addresses could not be added')).toBeInTheDocument();
  });

  it('cancels without adding', async () => {
    const { onCancel } = renderBulk();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.add).not.toHaveBeenCalled();
  });
});
