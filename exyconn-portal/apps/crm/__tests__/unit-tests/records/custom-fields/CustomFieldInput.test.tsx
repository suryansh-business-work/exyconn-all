import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { CustomFieldsHarness, OPTIONS, customDef } from './custom-field-harness';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  DatePicker: (await import('../date-picker-stub')).DatePickerStub,
}));

const upload = vi.hoisted(() => ({ send: vi.fn(), uploading: false }));
vi.mock('../../../../src/records/detail/media/useCrmUpload', () => ({
  useCrmUpload: () => upload,
}));

const logger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('CustomFieldsSection', () => {
  it('renders nothing without custom properties', () => {
    renderWithProviders(<CustomFieldsHarness properties={[]} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('region', { name: 'Custom properties' })).not.toBeInTheDocument();
  });

  it('lists one input per property under a heading', () => {
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'a', label: 'Alpha' }), customDef({ key: 'b', label: 'Beta' })]}
        onSubmit={vi.fn()}
      />,
    );
    const section = screen.getByRole('region', { name: 'Custom properties' });
    expect(within(section).getByRole('heading', { name: 'Custom properties' })).toBeVisible();
    expect(within(section).getAllByRole('textbox')).toHaveLength(2);
  });
});

describe('CustomFieldInput: text-like', () => {
  it('uses the right input type and shows the help text until there is an error', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness
        properties={[
          customDef({
            key: 'mail',
            label: 'Billing email',
            type: CrmPropertyType.Email,
            required: true,
            description: 'Where invoices go',
          }),
          customDef({ key: 'tel', label: 'Desk', type: CrmPropertyType.Phone }),
          customDef({ key: 'site', label: 'Site', type: CrmPropertyType.Url }),
          customDef({ key: 'size', label: 'Seats', type: CrmPropertyType.Number }),
          customDef({ key: 'notes', label: 'Notes', type: CrmPropertyType.Textarea }),
        ]}
        initial={{ mail: '', tel: '', site: '', size: '', notes: '' }}
        onSubmit={onSubmit}
      />,
    );
    const email = screen.getByRole('textbox', { name: 'Billing email' });
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Desk' })).toHaveAttribute('type', 'tel');
    expect(screen.getByRole('textbox', { name: 'Site' })).toHaveAttribute('type', 'url');
    expect(screen.getByRole('spinbutton', { name: 'Seats' })).toHaveAttribute('type', 'number');
    expect(screen.getByRole('textbox', { name: 'Notes' }).tagName).toBe('TEXTAREA');
    expect(screen.getByText('Where invoices go')).toBeInTheDocument();

    await save();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Where invoices go')).not.toBeInTheDocument();

    await userEvent.type(email, 'billing@acme.io');
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Seats' }), '25');
    await save();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        mail: 'billing@acme.io',
        tel: '',
        site: '',
        size: '25',
        notes: '',
      }),
    );
  });

  it('shows a blank text box for a value the form does not have yet', () => {
    renderWithProviders(
      <CustomFieldsHarness properties={[customDef({ label: 'Plain' })]} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('textbox', { name: 'Plain' })).toHaveValue('');
  });
});

describe('CustomFieldInput: dropdown and Yes/No', () => {
  it('offers Not set on an optional dropdown and picks a choice', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'tier', label: 'Tier', type: CrmPropertyType.Enum, options: OPTIONS })]}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Tier' }));
    const list = screen.getByRole('listbox');
    expect(within(list).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Not set',
      'Alpha',
      'Beta',
      'Gamma',
    ]);
    await userEvent.click(within(list).getByRole('option', { name: 'Beta' }));
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ tier: 'B' }));
  });

  it('offers only Yes and No on a required Yes/No and insists on one', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'vip', label: 'VIP', type: CrmPropertyType.Boolean, required: true })]}
        initial={{ vip: '' }}
        onSubmit={onSubmit}
      />,
    );
    await save();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: /VIP/ }));
    const list = screen.getByRole('listbox');
    expect(within(list).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Yes',
      'No',
    ]);
    await userEvent.click(within(list).getByRole('option', { name: 'No' }));
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ vip: 'false' }));
  });
});

describe('CustomFieldInput: radio and checkboxes', () => {
  it('picks one radio choice', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'size', label: 'Size', type: CrmPropertyType.Radio, options: OPTIONS })]}
        onSubmit={onSubmit}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    await userEvent.click(within(group).getByRole('radio', { name: 'Gamma' }));
    expect(within(group).getByRole('radio', { name: 'Gamma' })).toBeChecked();
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ size: 'C' }));
  });

  it('keeps ticked boxes in the property order and unticks them', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness
        properties={[
          customDef({
            key: 'tags',
            label: 'Interests',
            type: CrmPropertyType.MultiSelect,
            options: OPTIONS,
            required: true,
            description: 'Tick any',
          }),
        ]}
        initial={{ tags: 'B' }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText('Tick any')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Gamma' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }));
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith({ tags: 'A\nB\nC' }));

    for (const name of ['Alpha', 'Beta', 'Gamma']) {
      await userEvent.click(screen.getByRole('checkbox', { name }));
    }
    await save();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });

  it('starts with nothing ticked when the value is missing', () => {
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'tags', label: 'Interests', type: CrmPropertyType.MultiSelect, options: OPTIONS })]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked)).toEqual(
      [],
    );
  });

  it('shows an unset radio group with nothing chosen', () => {
    renderWithProviders(
      <CustomFieldsHarness
        properties={[customDef({ key: 'size', label: 'Size', type: CrmPropertyType.Radio, options: OPTIONS })]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('radio').some((radio) => (radio as HTMLInputElement).checked)).toBe(
      false,
    );
  });
});

describe('CustomFieldInput: date', () => {
  const DAY = customDef({ key: 'renewal', label: 'Renewal', type: CrmPropertyType.Date, description: 'Contract end' });

  it('keeps the picked calendar day as yyyy-MM-dd', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<CustomFieldsHarness properties={[DAY]} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Renewal');
    expect(input).toHaveAttribute('data-value', '');
    expect(screen.getByText('Contract end')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '2026-11-30' } });
    expect(input).toHaveAttribute('data-value', new Date(2026, 10, 30).toDateString());
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ renewal: '2026-11-30' }));
  });

  it('treats a half-typed or cleared date as not set', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness properties={[DAY]} initial={{ renewal: '2026-01-02' }} onSubmit={onSubmit} />,
    );
    const input = screen.getByLabelText('Renewal');
    expect(input).toHaveAttribute('data-value', new Date(2026, 0, 2).toDateString());
    fireEvent.change(input, { target: { value: 'bad' } });
    expect(input).toHaveAttribute('data-value', '');
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith({ renewal: '' }));
    fireEvent.change(input, { target: { value: '2026-03-04' } });
    fireEvent.change(input, { target: { value: '' } });
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit).toHaveBeenLastCalledWith({ renewal: '' });
  });

  it('shows nothing for a stored value that is not a date', () => {
    renderWithProviders(
      <CustomFieldsHarness properties={[DAY]} initial={{ renewal: 'soon' }} onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText('Renewal')).toHaveAttribute('data-value', '');
  });

  it('marks a required date and reports it missing', async () => {
    renderWithProviders(
      <CustomFieldsHarness properties={[{ ...DAY, required: true }]} initial={{ renewal: '' }} onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText('Renewal')).toHaveAttribute('aria-required', 'true');
    fireEvent.blur(screen.getByLabelText('Renewal'));
    await save();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });
});

describe('CustomFieldInput: file', () => {
  const FILE = customDef({ key: 'contract', label: 'Contract', type: CrmPropertyType.File, description: 'PDF please' });

  beforeEach(() => {
    vi.clearAllMocks();
    upload.uploading = false;
  });

  it('uploads a picked file and keeps its address', async () => {
    upload.send.mockResolvedValue({ url: 'https://cdn.io/x/Deal%20terms.pdf', name: 'a', contentType: '' });
    const onSubmit = vi.fn();
    renderWithProviders(<CustomFieldsHarness properties={[FILE]} onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
    expect(screen.getByText('PDF please')).toBeInTheDocument();

    const file = new File(['%PDF'], 'terms.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('Contract'), file);

    expect(upload.send).toHaveBeenCalledWith(file);
    expect(await screen.findByRole('link', { name: 'Deal terms.pdf' })).toHaveAttribute(
      'href',
      'https://cdn.io/x/Deal%20terms.pdf',
    );
    expect(screen.getByRole('button', { name: 'Replace file' })).toBeInTheDocument();
    await save();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ contract: 'https://cdn.io/x/Deal%20terms.pdf' }),
    );
  });

  it('removes the stored file', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CustomFieldsHarness properties={[FILE]} initial={{ contract: 'https://cdn.io/a.pdf' }} onSubmit={onSubmit} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ contract: '' }));
  });

  it('opens the file picker from the button', async () => {
    renderWithProviders(<CustomFieldsHarness properties={[FILE]} onSubmit={vi.fn()} />);
    const input = screen.getByLabelText('Contract');
    const click = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Upload file' }));
    expect(click).toHaveBeenCalled();
  });

  it('ignores a picker closed without a file', () => {
    renderWithProviders(<CustomFieldsHarness properties={[FILE]} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Contract'), { target: { files: [] } });
    expect(upload.send).not.toHaveBeenCalled();
  });

  it('shows why an upload failed and logs it', async () => {
    const failure = new Error('Files can be 10 MB at most.');
    upload.send.mockRejectedValue(failure);
    renderWithProviders(<CustomFieldsHarness properties={[FILE]} onSubmit={vi.fn()} />);
    await userEvent.upload(screen.getByLabelText('Contract'), new File(['x'], 'big.mov'));
    expect(await screen.findByText('Files can be 10 MB at most.')).toBeInTheDocument();
    expect(logger.warn).toHaveBeenCalledWith('crm: uploading a file property failed', failure);
  });

  it('falls back to a general message for a failure without one', async () => {
    upload.send.mockRejectedValue({});
    renderWithProviders(<CustomFieldsHarness properties={[FILE]} onSubmit={vi.fn()} />);
    await userEvent.upload(screen.getByLabelText('Contract'), new File(['x'], 'a.pdf'));
    expect(await screen.findByText('The file could not be uploaded.')).toBeInTheDocument();
  });

  it('says a required file is missing and shows progress while uploading', async () => {
    upload.uploading = true;
    renderWithProviders(
      <CustomFieldsHarness
        properties={[{ ...FILE, required: true }]}
        initial={{ contract: '' }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Upload file/ })).toBeDisabled();
    await save();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });
});
