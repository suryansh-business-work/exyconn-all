import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentImpact } from '@exyconn/shell/graphql/generated';
import {
  INCIDENT_DEFAULTS,
  IncidentForm,
  incidentSchema,
} from '../../../../../../src/pages/incidents/forms/incident';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fill,
  formCallbacks,
  pickMany,
  pickOption,
  press,
  toast,
} from '../../../environment-variables/forms/form.helpers';
import { MONITORS } from '../../incidents.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), monitors: vi.fn() }));
/** The options the form handed `useEntitySave` on its last render. */
const saved = vi.hoisted(() => ({
  options: null as null | { update: (row: unknown, values: unknown) => Promise<unknown> },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateStatusIncidentMutation: () => [gql.create],
  useListStatusMonitorsQuery: gql.monitors,
}));

vi.mock('@exyconn/shell/components/form/useEntitySave', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/form/useEntitySave')>();
  return {
    ...actual,
    useEntitySave: (options: Parameters<typeof actual.useEntitySave>[0]) => {
      saved.options = options;
      return actual.useEntitySave(options);
    },
  };
});

const cb = formCallbacks();
const SERVICES = /^Affected services/;
const BODY = 'What do we know?';

const renderForm = () =>
  renderWithProviders(<IncidentForm onDone={cb.onDone} onCancel={cb.onCancel} />);

describe('IncidentForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.monitors.mockReset().mockReturnValue({ data: MONITORS });
    saved.options = null;
    cb.reset();
  });

  it('starts as a major incident with nothing else filled in', () => {
    expect(INCIDENT_DEFAULTS).toEqual({
      title: '',
      impact: IncidentImpact.Major,
      affectedServiceKeys: [],
      body: '',
    });
    renderForm();
    expect(screen.getByRole('combobox', { name: /^Impact/ })).toHaveTextContent('Major');
    expect(
      screen.getByText('Posted as the first update, marked Investigating'),
    ).toBeInTheDocument();
  });

  it('asks for a headline, an affected service and what is known', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Give the incident a title',
      'Choose at least one affected service',
      'Say what is known so far — at least 10 characters',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the title and the first update within bounds', async () => {
    renderForm();
    fill('Title', 't'.repeat(121));
    fill(BODY, 'b'.repeat(4001));
    await press('Create');
    await expectMessages('Keep the title short', 'Keep the update under 4000 characters');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('opens a critical incident on the chosen services', async () => {
    renderForm();
    fill('Title', 'Login is failing');
    await pickOption(/^Impact/, 'Critical');
    await pickMany(SERVICES, ['Portal API', 'Website']);
    fill(BODY, 'Sign-in returns a 502 for every user');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Login is failing',
          impact: IncidentImpact.Critical,
          affectedServiceKeys: ['api', 'web'],
          body: 'Sign-in returns a 502 for every user',
        },
      },
    });
    expect(await toast()).toHaveTextContent('Incident created');
  });

  it('offers no services while the monitors have not loaded', async () => {
    gql.monitors.mockReturnValue({ data: undefined });
    renderForm();
    await userEvent.click(screen.getByRole('combobox', { name: SERVICES }));
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('reports a failed save and stays open', async () => {
    gql.create.mockRejectedValue(new Error('An incident for this service is already open'));
    renderForm();
    fill('Title', 'Login is failing');
    await pickMany(SERVICES, ['Portal API']);
    fill(BODY, 'Sign-in returns a 502 for every user');
    await press('Create');
    expect(await toast()).toHaveTextContent('An incident for this service is already open');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('never edits: an incident is told through updates, so update sends nothing', async () => {
    renderForm();
    await expect(saved.options?.update({}, {})).resolves.toBeUndefined();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('trims what is typed before checking it', () => {
    const parsed = incidentSchema.safeParse({
      ...INCIDENT_DEFAULTS,
      title: '   Outage   ',
      affectedServiceKeys: ['api'],
      body: '  ten chars!  ',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.title).toBe('Outage');
    expect(incidentSchema.safeParse({ ...INCIDENT_DEFAULTS, title: '  Dow  ' }).success).toBe(
      false,
    );
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
