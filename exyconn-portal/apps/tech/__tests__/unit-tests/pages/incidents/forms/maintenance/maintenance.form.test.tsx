import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
  MaintenanceForm,
  maintenanceSchema,
  toMaintenanceValues,
  type MaintenanceRow,
} from '../../../../../../src/pages/incidents/forms/maintenance';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fill,
  formCallbacks,
  pickMany,
  press,
  toast,
} from '../../../environment-variables/forms/form.helpers';
import { MONITORS, maintenanceRow } from '../../incidents.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), monitors: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateStatusMaintenanceMutation: () => [gql.create],
  useUpdateStatusMaintenanceMutation: () => [gql.update],
  useListStatusMonitorsQuery: gql.monitors,
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
  RhfDateTimePicker: (await import('./date-time.stub')).DateTimeStub,
}));

const cb = formCallbacks();
const SERVICES = /^Affected services/;
const STARTS = '2026-11-01T10:00:00.000Z';
const ENDS = '2026-11-01T12:00:00.000Z';
const stored: MaintenanceRow = maintenanceRow();

const renderForm = (initial: MaintenanceRow | null = null) =>
  renderWithProviders(
    <MaintenanceForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('toMaintenanceValues', () => {
  it('starts a new window empty', () => {
    expect(toMaintenanceValues(null)).toEqual({
      title: '',
      body: '',
      affectedServiceKeys: [],
      startsAt: '',
      endsAt: '',
    });
  });

  it('carries a stored window into the form, leaving out its bookkeeping', () => {
    expect(toMaintenanceValues(stored)).toEqual({
      title: 'Database upgrade',
      body: 'Mongo moves to the new cluster',
      affectedServiceKeys: ['api', 'web'],
      startsAt: STARTS,
      endsAt: ENDS,
    });
  });
});

describe('maintenanceSchema', () => {
  it('needs the window to end strictly after it starts', () => {
    const base = { ...toMaintenanceValues(stored) };
    expect(maintenanceSchema.safeParse(base).success).toBe(true);
    expect(maintenanceSchema.safeParse({ ...base, endsAt: STARTS }).success).toBe(false);
  });
});

describe('MaintenanceForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.monitors.mockReset().mockReturnValue({ data: MONITORS });
    cb.reset();
  });

  it('asks for a title, a service and both ends of the window', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Give the window a title',
      'Choose at least one affected service',
      'When does it start?',
      'When does it end?',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a window that ends before it starts, and an overlong notice', async () => {
    renderForm();
    fill('Title', 'x'.repeat(121));
    await pickMany(SERVICES, ['Website']);
    fill('Starts', ENDS);
    fill('Ends', STARTS);
    fill('Notice', 'n'.repeat(4001));
    await press('Create');
    await expectMessages('Keep the title short', 'Keep the notice under 4000 characters');

    fill('Title', 'Database upgrade');
    fill('Notice', '');
    await press('Create');
    await expectMessages('The window must end after it starts');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('plans a window over the chosen services', async () => {
    renderForm();
    fill('Title', 'Database upgrade');
    await pickMany(SERVICES, ['Portal API']);
    fill('Starts', STARTS);
    fill('Ends', ENDS);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Database upgrade',
          body: '',
          affectedServiceKeys: ['api'],
          startsAt: STARTS,
          endsAt: ENDS,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Maintenance window created');
  });

  it('reschedules a stored window by its id', async () => {
    renderForm(stored);
    expect(screen.getByLabelText('Title')).toHaveValue('Database upgrade');
    fill('Ends', '2026-11-01T13:00:00.000Z');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'mw-1',
        input: {
          title: 'Database upgrade',
          body: 'Mongo moves to the new cluster',
          affectedServiceKeys: ['api', 'web'],
          startsAt: STARTS,
          endsAt: '2026-11-01T13:00:00.000Z',
        },
      },
    });
    expect(await toast()).toHaveTextContent('Maintenance window updated');
  });

  it('shows the stored service keys while the monitors have not loaded', () => {
    gql.monitors.mockReturnValue({ data: undefined });
    renderForm(stored);
    const services = screen.getByRole('combobox', { name: SERVICES });
    expect(within(services).getByText('api')).toBeInTheDocument();
    expect(within(services).getByText('web')).toBeInTheDocument();
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('The window has already started'));
    renderForm(stored);
    await press('Update');
    expect(await toast()).toHaveTextContent('The window has already started');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
