import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ConvertLeadForm } from '../../../../../../src/pages/crm/forms/convert-lead';
import { renderWithProviders } from '../../../../test-utils';
import { leadRow } from '../../../../fixtures';
import { fillField, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ convert: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useConvertLeadMutation: () => [gql.convert],
}));

const LEAD = leadRow({
  id: 'lead-4',
  name: 'Kiran Shah',
  email: 'kiran@initech.com',
  value: 60000,
});

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ConvertLeadForm lead={LEAD} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('ConvertLeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.convert.mockResolvedValue({
      data: { convertLead: { id: 'deal-7', title: 'Initech platform deal' } },
    });
  });

  it('explains the conversion and starts from the lead', () => {
    renderForm();

    expect(
      screen.getByText(
        'Converting “Kiran Shah” marks the lead won and opens a deal at the top of the pipeline.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('');
    expect(screen.getByLabelText('Contact name')).toHaveValue('Kiran Shah');
    expect(screen.getByLabelText('Contact email')).toHaveValue('kiran@initech.com');
    expect(screen.getByLabelText('Deal title')).toHaveValue('Kiran Shah opportunity');
    expect(screen.getByLabelText('Deal value')).toHaveValue(60000);
  });

  it('needs a company, a deal title and the contact details', async () => {
    renderForm();
    await fillField('Deal title', ' ');
    await fillField('Contact name', ' ');
    await fillField('Contact email', 'kiran');
    setNumber('Deal value', '-1');

    await press('Convert');

    expect(await screen.findByText('Company is required')).toBeInTheDocument();
    expect(screen.getByText('Deal title is required')).toBeInTheDocument();
    expect(screen.getByText('Contact name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Value cannot be negative')).toBeInTheDocument();
    expect(gql.convert).not.toHaveBeenCalled();
  });

  it('asks for the contact email when it is cleared', async () => {
    renderForm();
    await fillField('Company', 'Initech');
    await fillField('Contact email', ' ');

    await press('Convert');

    expect(await screen.findByText('Contact email is required')).toBeInTheDocument();
  });

  it('converts the lead and names the deal the server created', async () => {
    const { onDone } = renderForm();
    await fillField('Company', 'Initech');

    await press('Convert');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.convert).toHaveBeenCalledWith({
      variables: {
        id: 'lead-4',
        input: {
          companyName: 'Initech',
          dealTitle: 'Kiran Shah opportunity',
          value: 60000,
          expectedCloseDate: null,
          contactName: 'Kiran Shah',
          contactEmail: 'kiran@initech.com',
        },
      },
    });
    expect(await screen.findByText('Deal "Initech platform deal" created')).toBeInTheDocument();
  });

  it('names the deal by its title when the server sends none back', async () => {
    gql.convert.mockResolvedValueOnce({ data: null });
    const { onDone } = renderForm();
    await fillField('Company', 'Initech');
    await fillField('Deal title', 'Initech pilot');

    await press('Convert');

    expect(await screen.findByText('Deal "Initech pilot" created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reports the server reason when the conversion fails', async () => {
    gql.convert.mockRejectedValueOnce(new Error('Lead already converted'));
    const { onDone } = renderForm();
    await fillField('Company', 'Initech');

    await press('Convert');

    expect(await screen.findByText('Lead already converted')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.convert.mockRejectedValueOnce(503);
    renderForm();
    await fillField('Company', 'Initech');

    await press('Convert');

    expect(await screen.findByText('Conversion failed')).toBeInTheDocument();
  });

  it('cancels without converting', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.convert).not.toHaveBeenCalled();
  });
});
