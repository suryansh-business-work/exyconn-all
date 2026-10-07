import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ListProjectsDocument, UpdateProjectDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientProjectsPicker } from '../../../../src/pages/clients/hub-access/ClientProjectsPicker';
import { listedProject } from './hub-access.fixtures';

const website = listedProject();
const app = listedProject({
  id: 'project-2',
  key: 'APP',
  name: 'Mobile app',
  clientId: 'client-9',
  clientName: 'Globex',
});
const ops = listedProject({
  id: 'project-3',
  key: 'OPS',
  name: 'Ops desk',
  clientId: 'client-1',
  clientName: 'Acme',
});

const list = (rows = [website, app, ops]): MockLink.MockedResponse => ({
  request: { query: ListProjectsDocument },
  result: { data: { listProjects: rows } },
});

/** The update the picker sends: the whole project, with only its client changed. */
const moved = (
  project: typeof website,
  clientId: string | null,
  error?: Error,
): MockLink.MockedResponse => ({
  request: {
    query: UpdateProjectDocument,
    variables: {
      id: project.id,
      input: {
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetAmount: project.budgetAmount,
        budgetHours: project.budgetHours,
        clientId,
      },
    },
  },
  ...(error
    ? { error }
    : { result: { data: { updateProject: { __typename: 'Project', id: project.id } } } }),
});

const box = (name: string) => screen.findByRole('checkbox', { name });
const snackbar = () => document.querySelector('.MuiSnackbar-root');

describe('ClientProjectsPicker', () => {
  it('ticks the client’s own projects and names the client of anybody else’s', async () => {
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, { mocks: [list()] });
    expect(screen.getByText('Projects in the client hub')).toBeInTheDocument();
    expect(await box('Ops desk')).toBeChecked();
    expect(await box('Website')).not.toBeChecked();
    expect(await box('Mobile app — currently Globex')).not.toBeChecked();
    expect(screen.queryByText(/No projects yet/)).toBeNull();
  });

  it('points to the Projects portal when there are no projects', async () => {
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, { mocks: [list([])] });
    expect(
      await screen.findByText('No projects yet. Create one in the Projects portal.'),
    ).toBeInTheDocument();
  });

  it('shows an unclaimed project to this client when it is ticked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, {
      mocks: [
        list(),
        moved(website, 'client-1'),
        list([{ ...website, clientId: 'client-1' }, app, ops]),
      ],
    });
    await user.click(await box('Website'));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Website' })).toBeChecked());
  });

  it('takes a project away from this client when it is unticked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, {
      mocks: [list(), moved(ops, null), list([website, app, { ...ops, clientId: null }])],
    });
    await user.click(await box('Ops desk'));
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Ops desk' })).not.toBeChecked(),
    );
  });

  it('asks before moving another client’s project, and leaves it when declined', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, { mocks: [list()] });
    await user.click(await box('Mobile app — currently Globex'));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Move project')).toBeInTheDocument();
    expect(
      dialog.getByText('Mobile app belongs to Globex. Show it to this client instead?'),
    ).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('checkbox', { name: 'Mobile app — currently Globex' }),
    ).not.toBeChecked();
    expect(snackbar()).toBeNull();
  });

  it('moves another client’s project once confirmed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, {
      mocks: [
        list(),
        moved(app, 'client-1'),
        list([website, { ...app, clientId: 'client-1', clientName: 'Acme' }, ops]),
      ],
    });
    await user.click(await box('Mobile app — currently Globex'));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Move' }),
    );
    expect(await box('Mobile app')).toBeChecked();
  });

  it('says why a project could not be changed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, {
      mocks: [list(), moved(website, 'client-1', new Error('Project is archived'))],
    });
    await user.click(await box('Website'));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Project is archived'));
    expect(screen.getByRole('checkbox', { name: 'Website' })).not.toBeChecked();
  });
});
