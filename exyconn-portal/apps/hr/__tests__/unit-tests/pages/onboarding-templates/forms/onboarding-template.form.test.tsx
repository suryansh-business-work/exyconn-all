import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OnboardingOwner,
  useCreateOnboardingTemplateMutation,
  useUpdateOnboardingTemplateMutation,
} from '@exyconn/shell/graphql/generated';
import {
  OnboardingTemplateForm,
  type OnboardingTemplateRow,
} from '../../../../../src/pages/onboarding-templates/forms/onboarding-template';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../../harness/gql-doubles';
import { fillField, press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateOnboardingTemplateMutation: vi.fn(),
  useUpdateOnboardingTemplateMutation: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();
const OFFER = 'Offer this template when starting an onboarding';

const template: OnboardingTemplateRow = {
  id: 'tpl-1',
  name: 'Engineering joiner',
  active: true,
  taskCount: 1,
  createdAt: '2026-03-04T12:00:00.000Z',
  tasks: [
    { key: 'set-up-laptop', label: 'Set up laptop', owner: OnboardingOwner.It, dueDaysFromJoin: 1 },
  ],
};

async function describeTask(index: number, label: string) {
  const field = screen.getAllByRole('textbox', { name: 'Task' })[index];
  await userEvent.clear(field);
  await userEvent.click(field);
  await userEvent.paste(label);
}

function setDue(index: number, value: string) {
  const field = screen.getAllByRole('spinbutton', { name: 'Due (days)' })[index];
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

async function chooseOwner(index: number, owner: string) {
  const select = screen.getAllByRole('combobox', { name: /^Owner/ })[index];
  await userEvent.click(select);
  await userEvent.click(
    within(await screen.findByRole('listbox')).getByRole('option', { name: owner }),
  );
}

function renderForm(initial: OnboardingTemplateRow | null) {
  const onDone = vi.fn();
  renderWithProviders(
    <OnboardingTemplateForm initial={initial} onDone={onDone} onCancel={vi.fn()} />,
  );
  return onDone;
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateOnboardingTemplateMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateOnboardingTemplateMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('OnboardingTemplateForm — creating', () => {
  it('starts offered, with one HR task due on the join date', () => {
    renderForm(null);
    expect(screen.getByLabelText(OFFER)).toBeChecked();
    expect(screen.getAllByRole('textbox', { name: 'Task' })).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: /^Owner/ })).toHaveTextContent('Hr');
    expect(screen.getByRole('spinbutton', { name: 'Due (days)' })).toHaveValue(0);
  });

  it('creates a template whose task keys come from their wording', async () => {
    const onDone = renderForm(null);
    await fillField('Template name', 'Engineering joiner');
    await describeTask(0, 'Set up laptop');
    await chooseOwner(0, 'It');
    setDue(0, '2');
    await press('Add task');
    await describeTask(1, 'Sign the contract');
    await press('Create');

    expect(await screen.findByText('Onboarding template created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Engineering joiner',
          active: true,
          tasks: [
            {
              key: 'set-up-laptop',
              label: 'Set up laptop',
              owner: OnboardingOwner.It,
              dueDaysFromJoin: 2,
            },
            {
              key: 'sign-the-contract',
              label: 'Sign the contract',
              owner: OnboardingOwner.Hr,
              dueDaysFromJoin: 0,
            },
          ],
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('needs a name of three characters and a described task', async () => {
    renderForm(null);
    await press('Create');
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Describe the task')).toBeInTheDocument();

    await fillField('Template name', 'ab');
    expect(await screen.findByText('Minimum 3 characters')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps each task due between the join date and a year after it, in whole days', async () => {
    renderForm(null);
    await press('Create');
    setDue(0, '-1');
    expect(
      await screen.findByText('A task cannot be due before the join date'),
    ).toBeInTheDocument();
    setDue(0, '400');
    expect(await screen.findByText('A year is as far out as onboarding goes')).toBeInTheDocument();
    setDue(0, '1.5');
    expect(await screen.findByText('Whole days only')).toBeInTheDocument();
  });

  it('needs at least one task', async () => {
    renderForm(null);
    await fillField('Template name', 'Empty');
    await press('remove task 1');
    expect(screen.queryByRole('textbox', { name: 'Task' })).not.toBeInTheDocument();
    await press('Create');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A template needs at least one task',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses two tasks that read the same', async () => {
    renderForm(null);
    await fillField('Template name', 'Badges');
    await describeTask(0, 'Order badge');
    await press('Add task');
    await describeTask(1, 'order BADGE!');
    await press('Create');
    expect(await screen.findByText('Two tasks cannot have the same wording')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('OnboardingTemplateForm — editing', () => {
  it('opens on the template and updates it by id', async () => {
    const onDone = renderForm(template);
    expect(screen.getByRole('textbox', { name: 'Template name' })).toHaveValue(
      'Engineering joiner',
    );
    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveValue('Set up laptop');
    await userEvent.click(screen.getByLabelText(OFFER));
    await press('Update');

    expect(await screen.findByText('Onboarding template updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'tpl-1',
        input: {
          name: 'Engineering joiner',
          active: false,
          tasks: [
            {
              key: 'set-up-laptop',
              label: 'Set up laptop',
              owner: OnboardingOwner.It,
              dueDaysFromJoin: 1,
            },
          ],
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
