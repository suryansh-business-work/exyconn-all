import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  ActivitySubject,
  ActivityType,
  CrmTimelineDocument,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { writeMemory } from '../../../../../src/records/comms/commsStore';
import { CallNoteForm } from '../../../../../src/records/comms/forms/call-note';
import { renderWithProviders } from '../../../test-utils';
import { fillField, press } from '../../../form-helpers';
import { commsPanel, resetDock } from '../comms-fixtures';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  options: vi.fn(),
  user: { name: 'Grace Hopper' } as { name: string } | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateActivityMutation: (options: unknown) => {
    gql.options(options);
    return [gql.create];
  },
}));

vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
  useAuth: () => ({ user: gql.user }),
}));

const PANEL = commsPanel({ channel: 'CALL' });

function renderForm(panel = PANEL) {
  const onCancel = vi.fn();
  renderWithProviders(<CallNoteForm panel={panel} onCancel={onCancel} />);
  return { onCancel };
}

describe('CallNoteForm', () => {
  beforeEach(() => {
    gql.user = { name: 'Grace Hopper' };
    gql.create.mockResolvedValue({ data: { createActivity: { id: 'a-1' } } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    resetDock();
  });

  it('logs the notes as a done note on the contact and clears the box', async () => {
    renderForm();

    await fillField('Notes', 'Demo Friday');
    await press('Save note');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            type: ActivityType.Note,
            subject: 'Call notes: Ada Lovelace',
            notes: 'Demo Friday',
            relatedType: ActivitySubject.Contact,
            relatedId: 'c-1',
            relatedName: 'Ada Lovelace',
            done: true,
            owner: 'Grace Hopper',
            attachments: [],
          },
        },
      }),
    );
    expect(gql.options).toHaveBeenCalledWith({ refetchQueries: [CrmTimelineDocument] });
    expect(await screen.findByText('Note saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveValue('');
  });

  it('logs on a company, with no owner when nobody is signed in', async () => {
    gql.user = null;
    renderForm(commsPanel({ channel: 'CALL', object: 'COMPANY', id: 'co-3' }));

    await fillField('Notes', 'Spoke to reception');
    await press('Save note');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({
            relatedType: ActivitySubject.Company,
            relatedId: 'co-3',
            owner: '',
          }),
        },
      }),
    );
  });

  it('starts from the remembered draft', () => {
    writeMemory(PANEL.key, 'call-note', { notes: 'Half a thought' });

    renderForm();

    expect(screen.getByLabelText('Notes')).toHaveValue('Half a thought');
  });

  it('does not save an empty note', async () => {
    renderForm();

    await press('Save note');

    expect(await screen.findByText('Write the note')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('shows the reason and keeps the notes when saving fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('Timeline is read-only');
    gql.create.mockRejectedValueOnce(failure);
    renderForm();

    await fillField('Notes', 'Callback Friday');
    await press('Save note');

    expect(await screen.findByText('Timeline is read-only')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: saving a call note failed', failure);
    expect(screen.getByLabelText('Notes')).toHaveValue('Callback Friday');
  });
});
