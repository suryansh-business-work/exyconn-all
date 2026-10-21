import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CallingBotScenarioForm,
  type CallingBotScenarioRow,
} from '../../../../../../src/pages/demos/forms/calling-bot-scenario';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../../../environment-variables/forms/form.helpers';
import { scenarioRow } from '../../calling-bot.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCallingBotScenarioMutation: () => [gql.create],
  useUpdateCallingBotScenarioMutation: () => [gql.update],
}));

const cb = formCallbacks();
const LANGUAGE = /^Language/;

const renderForm = (initial: CallingBotScenarioRow | null = null, nextOrder = 30) =>
  renderWithProviders(
    <CallingBotScenarioForm
      initial={initial}
      nextOrder={nextOrder}
      onDone={cb.onDone}
      onCancel={cb.onCancel}
    />,
  );

function fillExample() {
  fill('Title', 'Hotel booking');
  fill('Description', 'Book a sea-view room for two nights.');
  fill('Who the bot is', 'You are the reservations desk of a beach hotel in Goa.');
  fill('Opening line', 'Welcome to Sea Breeze.');
}

beforeEach(() => {
  gql.create.mockReset().mockResolvedValue({ data: {} });
  gql.update.mockReset().mockResolvedValue({ data: {} });
  cb.reset();
});

describe('CallingBotScenarioForm — a new example', () => {
  it('goes after the last example, speaks the settings’ language and is offered', () => {
    renderForm();
    expect(screen.getByLabelText(/^Order\s*\*?$/)).toHaveValue(30);
    expect(screen.getByRole('combobox', { name: LANGUAGE })).toHaveTextContent(
      'Same as the active settings',
    );
    expect(screen.getByRole('switch', { name: 'Offered on the demo' })).toBeChecked();
  });

  it('says what is missing instead of saving', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Title is required',
      'Say in a line what the visitor can try',
      'Describe the bot in at least a sentence',
      'Greeting is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it.each([
    ['2.5', 'Use a whole number'],
    ['-1', 'At least 0'],
    ['10001', 'At most 10000'],
  ])('checks the order %s', async (order, message) => {
    renderForm();
    fillExample();
    fill('Order', order);
    await press('Create');
    await expectMessages(message);
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('stores "same as the settings" as no language of its own', async () => {
    renderForm();
    fillExample();
    await userEvent.click(screen.getByRole('switch', { name: 'Offered on the demo' }));
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Hotel booking',
          description: 'Book a sea-view room for two nights.',
          systemPrompt: 'You are the reservations desk of a beach hotel in Goa.',
          greeting: 'Welcome to Sea Breeze.',
          languageCode: '',
          enabled: false,
          order: 30,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Calling bot example created');
  });

  it('stores a language the example names', async () => {
    renderForm();
    fillExample();
    await pickOption(LANGUAGE, 'Tamil');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create.mock.calls[0][0].variables.input.languageCode).toBe('ta-IN');
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('CallingBotScenarioForm — editing an example', () => {
  it('reads back an example on the settings’ language and saves it by id', async () => {
    renderForm(scenarioRow({ enabled: false }), 90);
    expect(screen.getByLabelText(/^Title\s*\*?$/)).toHaveValue('Clinic booking');
    expect(screen.getByLabelText(/^Order\s*\*?$/)).toHaveValue(10);
    expect(screen.getByRole('combobox', { name: LANGUAGE })).toHaveTextContent(
      'Same as the active settings',
    );
    expect(screen.getByRole('switch', { name: 'Offered on the demo' })).not.toBeChecked();
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'sc-1',
        input: expect.objectContaining({ languageCode: '', enabled: false, order: 10 }),
      },
    });
    expect(await toast()).toHaveTextContent('Calling bot example updated');
  });

  it('reads back an example’s own language', () => {
    renderForm(scenarioRow({ languageCode: 'ta-IN' }));
    expect(screen.getByRole('combobox', { name: LANGUAGE })).toHaveTextContent('Tamil');
  });
});
