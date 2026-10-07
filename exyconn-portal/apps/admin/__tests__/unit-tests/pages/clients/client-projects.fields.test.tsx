import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { renderWithProviders } from '../../test-utils';
import { FormHarness, formValues } from '../../form-harness';
import {
  ClientProjectsFields,
  type ClientProjectOption,
} from '../../../../src/pages/clients/forms/client/client-projects.fields';
import type { ClientFormValues } from '../../../../src/pages/clients/forms/client/client.types';
import { clientValues, project } from './client.fixtures';

const PROJECTS = [
  project(),
  project({
    id: 'project-2',
    key: 'APP',
    name: 'Mobile app',
    clientId: 'client-9',
    clientName: 'Globex',
  }),
  project({
    id: 'project-3',
    key: 'OPS',
    name: 'Ops desk',
    clientId: 'client-1',
    clientName: 'Acme',
  }),
];

interface RenderOptions {
  projects?: ClientProjectOption[];
  loading?: boolean;
  projectIds?: string[];
  requireOne?: boolean;
}

function renderField({
  projects = PROJECTS,
  loading = false,
  projectIds = [],
  requireOne = false,
}: RenderOptions = {}) {
  const schema = z.object({ projectIds: z.array(z.string()).min(1, 'Pick at least one project') });
  return renderWithProviders(
    <FormHarness<ClientFormValues>
      defaultValues={clientValues({ projectIds })}
      resolver={requireOne ? (zodResolver(schema) as never) : undefined}
    >
      <ClientProjectsFields clientId="client-1" projects={projects} loading={loading} />
    </FormHarness>,
  );
}

const field = () => screen.getByRole('combobox', { name: /Projects/ });

describe('ClientProjectsFields', () => {
  it('lists every project by key and name, saying which belong to another client', async () => {
    const user = userEvent.setup();
    renderField();
    expect(screen.getByText('Projects shown in this client’s hub')).toBeInTheDocument();

    await user.click(field());
    const list = within(screen.getByRole('listbox'));
    expect(list.getByRole('option', { name: /WEB · Website/ })).toBeInTheDocument();
    expect(list.getByRole('option', { name: /APP · Mobile app/ })).toHaveTextContent(
      'Currently with Globex',
    );
    expect(list.getByRole('option', { name: /OPS · Ops desk/ })).not.toHaveTextContent(
      'Currently with',
    );
  });

  it('links each project ticked and shows it as a chip', async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(field());
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /WEB/ }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /APP/ }));

    expect(formValues().projectIds).toEqual(['project-1', 'project-2']);
    const checks = within(screen.getByRole('listbox')).getAllByRole('checkbox');
    expect(checks.map((box) => (box as HTMLInputElement).checked)).toEqual([true, true, false]);
    await user.keyboard('{Escape}');
    // The menu hides the field from assistive tech until it has fully closed.
    const select = await screen.findByRole('combobox', { name: /Projects/ });
    expect(within(select).getByText('WEB · Website')).toBeInTheDocument();
    expect(within(select).getByText('APP · Mobile app')).toBeInTheDocument();
  });

  it('shows a linked project that is no longer listed by its id', () => {
    renderField({ projectIds: ['project-gone'] });
    expect(within(field()).getByText('project-gone')).toBeInTheDocument();
  });

  it('is disabled and says so while the projects load', () => {
    renderField({ projects: [], loading: true });
    expect(screen.getByText('Loading projects…')).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-disabled', 'true');
  });

  it('points to the Projects portal when there are none yet', () => {
    renderField({ projects: [] });
    expect(
      screen.getByText('No projects yet. Create one in the Projects portal.'),
    ).toBeInTheDocument();
  });

  it('shows a validation message in place of the hint', async () => {
    const user = userEvent.setup();
    renderField({ requireOne: true });
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Pick at least one project')).toBeInTheDocument();
    expect(screen.queryByText('Projects shown in this client’s hub')).toBeNull();
  });
});
