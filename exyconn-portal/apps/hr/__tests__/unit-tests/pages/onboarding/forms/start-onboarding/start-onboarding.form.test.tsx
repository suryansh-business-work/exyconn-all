import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartOnboardingForm } from '../../../../../../src/pages/onboarding/forms/start-onboarding';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  start: vi.fn(),
  people: undefined as unknown,
  templates: undefined as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartOnboardingMutation: () => [gql.start],
  useListEmployeeOptionsQuery: () => ({ data: gql.people }),
  useListOnboardingTemplatesQuery: () => ({ data: gql.templates }),
}));

const PEOPLE = {
  listEmployeeOptions: [{ id: 'emp-1', name: 'Asha Rao', email: 'asha@example.com' }],
};
const TEMPLATES = {
  listOnboardingTemplates: [
    { id: 'tpl-1', name: 'Engineering joiner', active: true, taskCount: 6 },
    { id: 'tpl-old', name: 'Retired joiner', active: false, taskCount: 3 },
  ],
};
const NO_TEMPLATE_HINT = 'Add a template in HR → Onboarding Templates first.';

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<StartOnboardingForm onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function fillIn() {
  const user = userEvent.setup();
  await user.type(screen.getByRole('combobox', { name: 'Employee' }), 'Asha');
  await user.click(await screen.findByRole('option', { name: 'Asha Rao (asha@example.com)' }));
  await user.click(screen.getByRole('combobox', { name: /Template/ }));
  await user.click(
    within(screen.getByRole('listbox')).getByRole('option', {
      name: 'Engineering joiner — 6 tasks',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Start onboarding' }));
}

describe('StartOnboardingForm', () => {
  beforeEach(() => {
    gql.start.mockReset();
    gql.people = PEOPLE;
    gql.templates = TEMPLATES;
  });

  it('starts the chosen joiner on the chosen template and says the employee was told', async () => {
    gql.start.mockResolvedValue({ data: { startOnboarding: { id: 'checklist-1' } } });
    const { onDone } = renderForm();

    await fillIn();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.start).toHaveBeenCalledWith({
      variables: { employeeId: 'emp-1', templateId: 'tpl-1' },
    });
    expect(
      await screen.findByText('Onboarding started — the employee has been told'),
    ).toBeInTheDocument();
  });

  it('offers only the templates still in use', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: /Template/ }));
    const list = within(screen.getByRole('listbox'));

    expect(list.getByRole('option', { name: 'Engineering joiner — 6 tasks' })).toBeInTheDocument();
    expect(list.queryByRole('option', { name: /Retired joiner/ })).not.toBeInTheDocument();
    expect(screen.queryByText(NO_TEMPLATE_HINT)).not.toBeInTheDocument();
  });

  it('points HR to the templates page while there is none to pick', () => {
    gql.people = undefined;
    gql.templates = undefined;
    renderForm();

    expect(screen.getByText(NO_TEMPLATE_HINT)).toBeInTheDocument();
  });

  it('asks for both the employee and the template before starting anything', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Start onboarding' }));

    expect(await screen.findByText('Choose the employee joining')).toBeInTheDocument();
    expect(screen.getByText('Choose a template')).toBeInTheDocument();
    expect(gql.start).not.toHaveBeenCalled();
  });

  it("reports the server's reason and keeps the form open", async () => {
    gql.start.mockRejectedValue(new Error('Asha already has an open checklist'));
    const { onDone } = renderForm();

    await fillIn();

    expect(await screen.findByText('Asha already has an open checklist')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    gql.start.mockRejectedValue('offline');
    renderForm();

    await fillIn();

    expect(await screen.findByText('Could not start onboarding')).toBeInTheDocument();
  });

  it('cancels without starting', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.start).not.toHaveBeenCalled();
  });
});
