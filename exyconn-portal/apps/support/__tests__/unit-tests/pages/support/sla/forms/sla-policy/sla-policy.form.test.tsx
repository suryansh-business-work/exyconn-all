import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportPriority } from '@exyconn/shell/graphql/generated';
import {
  SLA_MINUTE_LIMITS,
  SlaPolicyForm,
  type SlaPolicyRow,
} from '../../../../../../../src/pages/support/sla/forms/sla-policy';
import { renderWithProviders } from '../../../../../test-utils';
import { click, fill, pickOption } from '../../../../../form.helpers';
import { slaPolicyRow } from '../../../../../fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateSupportSlaPolicyMutation: () => [gql.create],
  useUpdateSupportSlaPolicyMutation: () => [gql.update],
}));

const FIRST = 'First response (minutes)';
const RESOLUTION = 'Resolution (minutes)';

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: SlaPolicyRow | null = null) =>
  renderWithProviders(<SlaPolicyForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('SlaPolicyForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new policy at Medium: four hours to answer, a day to finish, active', () => {
    renderForm();
    expect(screen.getByRole('combobox', { name: /^Priority/ })).toHaveTextContent('Medium');
    expect(screen.getByLabelText(FIRST)).toHaveValue(240);
    expect(screen.getByLabelText(RESOLUTION)).toHaveValue(1440);
    expect(screen.getByLabelText('Active')).toBeChecked();
    expect(
      screen.getByText('How long a ticket may wait before somebody answers it.'),
    ).toBeInTheDocument();
  });

  it('creates the policy with the minutes as numbers', async () => {
    renderForm();
    await pickOption(/^Priority/, 'High');
    fill(FIRST, '30');
    fill(RESOLUTION, '480');
    await userEvent.click(screen.getByLabelText('Active'));
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          priority: SupportPriority.High,
          firstResponseMinutes: 30,
          resolutionMinutes: 480,
          active: false,
        },
      },
    });
    expect(await screen.findByText('SLA policy created')).toBeInTheDocument();
  });

  it('accepts a first response promised for the same minute as the resolution', async () => {
    renderForm();
    fill(FIRST, '60');
    fill(RESOLUTION, '60');
    await click('Create');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it('refuses a first response promised after the resolution', async () => {
    renderForm(slaPolicyRow());
    fill(FIRST, '600');
    await click('Update');
    expect(
      await screen.findByText('A first response cannot be promised later than the resolution'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('refuses a window of no minutes', async () => {
    renderForm();
    fill(RESOLUTION, '0');
    await click('Create');
    expect(await screen.findByText('Resolution must be at least 1 minute')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a window longer than thirty days', async () => {
    renderForm();
    fill(RESOLUTION, String(SLA_MINUTE_LIMITS.max + 1));
    await click('Create');
    expect(await screen.findByText('Resolution must be at most 43200 minutes')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses part minutes', async () => {
    renderForm();
    fill(FIRST, '1.5');
    await click('Create');
    expect(await screen.findByText('First response must be whole minutes')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('saves an existing policy back onto itself', async () => {
    renderForm(slaPolicyRow());
    expect(screen.getByRole('combobox', { name: /^Priority/ })).toHaveTextContent('High');
    expect(screen.getByLabelText(FIRST)).toHaveValue(60);
    await click('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'policy-1',
        input: {
          priority: SupportPriority.High,
          firstResponseMinutes: 60,
          resolutionMinutes: 480,
          active: true,
        },
      },
    });
    expect(await screen.findByText('SLA policy updated')).toBeInTheDocument();
  });

  it('keeps the form open with a plain message when the save fails without a reason', async () => {
    gql.create.mockRejectedValue('offline');
    renderForm();
    await click('Create');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
