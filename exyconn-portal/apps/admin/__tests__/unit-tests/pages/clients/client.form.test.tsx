import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientProjectOptionsDocument, ClientStatus } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientForm } from '../../../../src/pages/clients/forms/client';
import type { ClientProjectOption } from '../../../../src/pages/clients/forms/client/client-projects.fields';
import { client, project } from './client.fixtures';

const save = vi.hoisted(() => ({
  submit: vi.fn<(values: unknown) => Promise<void>>(),
  hook: vi.fn<(initial: unknown, onDone: unknown) => void>(),
}));

vi.mock('../../../../src/pages/clients/forms/client/useClientSave', () => ({
  useClientSave: (initial: unknown, onDone: unknown) => {
    save.hook(initial, onDone);
    return save.submit;
  },
}));

const options = (rows: ClientProjectOption[], delay = 0) => ({
  request: { query: ClientProjectOptionsDocument },
  result: { data: { clientProjectOptions: rows } },
  delay,
});

const PROJECTS = [
  project(),
  project({
    id: 'project-3',
    key: 'OPS',
    name: 'Ops desk',
    clientId: 'client-1',
    clientName: 'Acme',
  }),
];

beforeEach(() => {
  save.submit.mockReset();
  save.submit.mockResolvedValue(undefined);
  save.hook.mockReset();
});

describe('ClientForm', () => {
  it('lays out contact, location, tax and projects for a new client', async () => {
    renderWithProviders(<ClientForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />, {
      mocks: [options(PROJECTS, 30)],
    });
    for (const section of ['Contact', 'Location', 'Tax & billing', 'Projects']) {
      expect(screen.getAllByText(section).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Loading projects…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(await screen.findByText('Projects shown in this client’s hub')).toBeInTheDocument();
  });

  it('validates the required contact fields before saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />, {
      mocks: [options(PROJECTS)],
    });
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'priya@');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Phone is required')).toBeInTheDocument();
    expect(screen.getByText('Company is required')).toBeInTheDocument();
    expect(save.submit).not.toHaveBeenCalled();
  });

  it('hands a valid new client, a prospect by default, to the save', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderWithProviders(<ClientForm initial={null} onDone={onDone} onCancel={vi.fn()} />, {
      mocks: [options(PROJECTS)],
    });
    expect(save.hook).toHaveBeenCalledWith(null, onDone);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Priya Shah');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'priya@acme.example');
    await user.type(screen.getByRole('textbox', { name: 'Phone' }), '+91 98765 43210');
    await user.type(screen.getByRole('textbox', { name: 'Company' }), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(save.submit).toHaveBeenCalledTimes(1));
    expect(save.submit.mock.calls[0][0]).toMatchObject({
      name: 'Priya Shah',
      company: 'Acme',
      status: ClientStatus.Prospect,
      projectIds: [],
    });
  });

  it('preselects the projects already linked to the client being edited', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientForm initial={client()} onDone={vi.fn()} onCancel={vi.fn()} />, {
      mocks: [options(PROJECTS)],
    });
    const projects = await screen.findByRole('combobox', { name: /Projects/ });
    await waitFor(() => expect(within(projects).getByText('OPS · Ops desk')).toBeInTheDocument());
    expect(within(projects).queryByText('WEB · Website')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(save.submit).toHaveBeenCalledTimes(1));
    expect(save.submit.mock.calls[0][0]).toMatchObject({
      name: 'Priya Shah',
      country: 'IN',
      projectIds: ['project-3'],
    });
  });

  it('cancels without saving', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<ClientForm initial={null} onDone={vi.fn()} onCancel={onCancel} />, {
      mocks: [options(PROJECTS)],
    });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(save.submit).not.toHaveBeenCalled();
  });
});
