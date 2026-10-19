import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  CallingBotKey,
  CallingBotPhoneProvider,
  CallingBotSecret,
} from '@exyconn/shell/graphql/generated';
import { CallingBotConfigForm } from '../../../../../../src/pages/demos/forms/calling-bot-config';
import type { CallingBotConfigRow } from '../../../../../../src/pages/demos/forms/calling-bot-config';
import { KEY_SOURCES } from '../../../../../../src/pages/demos/forms/calling-bot-config/calling-bot-key-guide';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fakeSecret,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../../../environment-variables/forms/form.helpers';
import { configRow } from '../../calling-bot.fixtures';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  reveal: vi.fn(),
  testKey: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCallingBotConfigMutation: () => [gql.create],
  useUpdateCallingBotConfigMutation: () => [gql.update],
  useRevealCallingBotSecretMutation: () => [gql.reveal],
  useTestCallingBotKeyMutation: () => [gql.testKey],
}));

const cb = formCallbacks();
const SARVAM = fakeSecret('sv-', 20);
const OPENAI = fakeSecret('sk-', 24);
const PROVIDER = /^Place phone calls through/;
const VOICE = /^Voice(?! model)/;

const renderForm = (initial: CallingBotConfigRow | null = null) =>
  renderWithProviders(
    <CallingBotConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

const guide = () => screen.getByRole('button', { name: 'Where to get these keys' });

/** Fills what a new browser-only config needs. */
function fillRequired() {
  fill('Label', 'Clinic bot');
  fill('Sarvam AI key', SARVAM);
  fill('OpenAI key', OPENAI);
  fill('Who the bot is', 'You book appointments for a dental clinic.');
  fill('Greeting', 'Namaste');
}

beforeEach(() => {
  for (const fn of Object.values(gql)) {
    fn.mockReset();
  }
  gql.create.mockResolvedValue({ data: {} });
  gql.update.mockResolvedValue({ data: {} });
  cb.reset();
});

describe('CallingBotConfigForm — a new config', () => {
  it('opens the key guide with every console the bot needs', () => {
    renderForm();
    expect(guide()).toHaveAttribute('aria-expanded', 'true');
    for (const source of KEY_SOURCES) {
      expect(screen.getByRole('heading', { name: source.provider })).toBeInTheDocument();
      const link = screen.getByRole('link', { name: `Open ${source.urlLabel}` });
      expect(link).toHaveAttribute('href', source.url);
      expect(link).toHaveAttribute('target', '_blank');
    }
    expect(
      screen.getByText('Fills in: Vobiz Auth ID, Vobiz Auth Token, Calling number'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'dashboard.sarvam.ai' })).toHaveAttribute(
      'href',
      'https://dashboard.sarvam.ai',
    );
  });

  it('starts from a fast model, Hindi and the free-tier voice, browser calls only', () => {
    renderForm();
    expect(screen.getByLabelText('OpenAI model')).toHaveValue('gpt-4o-mini');
    expect(screen.getByRole('combobox', { name: /^Language/ })).toHaveTextContent('Hindi');
    expect(screen.getByRole('combobox', { name: /^Voice model/ })).toHaveTextContent('bulbul:v2');
    expect(screen.getByRole('combobox', { name: VOICE })).toHaveTextContent('anushka');
    expect(screen.getByLabelText('Longest call (seconds)')).toHaveValue(300);
    expect(screen.getByRole('combobox', { name: PROVIDER })).toHaveTextContent(
      'No phone calls (browser call only)',
    );
    expect(screen.queryByLabelText('Vobiz Auth ID')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Twilio Account SID')).not.toBeInTheDocument();
  });

  it('says what is missing instead of saving', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Sarvam AI key is required',
      'OpenAI key is required',
      'Describe the bot in at least a sentence',
      'Greeting is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active browser-only config', async () => {
    renderForm();
    fillRequired();
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Clinic bot',
          sarvamApiKey: SARVAM,
          openAiApiKey: OPENAI,
          openAiModel: 'gpt-4o-mini',
          systemPrompt: 'You book appointments for a dental clinic.',
          greeting: 'Namaste',
          languageCode: 'hi-IN',
          ttsModel: 'bulbul:v2',
          ttsSpeaker: 'anushka',
          maxCallSeconds: 300,
          phoneProvider: CallingBotPhoneProvider.None,
          vobizAuthId: '',
          vobizAuthToken: '',
          vobizNumber: '',
          twilioAccountSid: '',
          twilioAuthToken: '',
          twilioNumber: '',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Calling bot config created');
  });

  it('switches to the new model’s first voice', async () => {
    renderForm();
    await pickOption(/^Voice model/, 'bulbul:v3');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: VOICE })).toHaveTextContent('shubh'),
    );
  });

  it('keeps a voice the new model also has', async () => {
    renderForm();
    await pickOption(VOICE, 'vidya');
    await pickOption(/^Voice model/, 'bulbul:v2');
    expect(screen.getByRole('combobox', { name: VOICE })).toHaveTextContent('vidya');
  });

  it('only shows what an eye can see on a new config: the typed key', async () => {
    renderForm();
    fill('Sarvam AI key', SARVAM);
    await press('Show Sarvam AI key');
    expect(screen.getByLabelText('Sarvam AI key')).toHaveAttribute('type', 'text');
    expect(gql.reveal).not.toHaveBeenCalled();
  });

  it('tests a typed key before it is saved', async () => {
    gql.testKey.mockResolvedValue({ data: { testCallingBotKey: 'OpenAI answered' } });
    renderForm();
    fill('OpenAI key', OPENAI);
    await press('Test the OpenAI key');
    expect(await toast()).toHaveTextContent('OpenAI answered');
    expect(gql.testKey.mock.calls[0][0].variables.input).toMatchObject({
      configId: undefined,
      key: CallingBotKey.Openai,
      openAiApiKey: OPENAI,
    });
  });

  it('asks for the Vobiz account once Vobiz rings phones, and tests it', async () => {
    gql.testKey.mockResolvedValue({ data: { testCallingBotKey: 'Vobiz account found' } });
    renderForm();
    await pickOption(PROVIDER, 'Vobiz');
    expect(screen.getByRole('link', { name: 'console.vobiz.ai' })).toBeInTheDocument();
    fillRequired();
    await press('Create');
    await expectMessages(
      'Vobiz Auth ID is required',
      'Vobiz Auth Token is required',
      'The Vobiz calling number is required',
    );
    await press('Test the Vobiz Auth Token');
    await waitFor(() =>
      expect(gql.testKey.mock.calls[0][0].variables.input.key).toBe(CallingBotKey.Vobiz),
    );
  });

  it('asks for the Twilio account once Twilio rings phones, and tests it', async () => {
    gql.testKey.mockResolvedValue({ data: { testCallingBotKey: 'Twilio account found' } });
    renderForm();
    await pickOption(PROVIDER, 'Twilio');
    expect(screen.getByRole('link', { name: 'console.twilio.com' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Vobiz Auth ID')).not.toBeInTheDocument();
    fill('Twilio Account SID', 'AC123');
    fill('Calling number', '4155550100');
    fillRequired();
    await press('Create');
    await expectMessages(
      'A Twilio Account SID starts with AC and has 34 characters',
      'Use E.164, e.g. +918012345678',
      'Twilio Auth Token is required',
    );
    await press('Test the Twilio Auth Token');
    await waitFor(() =>
      expect(gql.testKey.mock.calls[0][0].variables.input.key).toBe(CallingBotKey.Twilio),
    );
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('CallingBotConfigForm — editing a saved config', () => {
  it('folds the key guide away and keeps the saved keys when left blank', async () => {
    renderForm(configRow({ isActive: false }));
    expect(guide()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('Label')).toHaveValue('Clinic bot');
    expect(screen.getByLabelText('Sarvam AI key')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /^Set as active/ })).toHaveTextContent('No');
    fill('Greeting', 'Hello from Smile Dental');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'cfg-1',
        input: expect.objectContaining({
          sarvamApiKey: '',
          openAiApiKey: '',
          greeting: 'Hello from Smile Dental',
          ttsSpeaker: 'vidya',
          isActive: false,
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Calling bot config updated');
  });

  it('fetches a saved key for its eye button', async () => {
    gql.reveal.mockResolvedValue({ data: { revealCallingBotSecret: 'saved-sarvam' } });
    renderForm(configRow());
    await press('Show Sarvam AI key');
    await waitFor(() => expect(screen.getByLabelText('Sarvam AI key')).toHaveValue('saved-sarvam'));
    expect(gql.reveal).toHaveBeenCalledWith({
      variables: { id: 'cfg-1', secret: CallingBotSecret.SarvamApiKey },
    });
  });

  it('keeps the saved voice of a model the form does not know', async () => {
    renderForm(configRow({ ttsModel: 'bulbul:v1', ttsSpeaker: 'meera' }));
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      ttsModel: 'bulbul:v1',
      ttsSpeaker: 'meera',
    });
  });

  it('lets a saved Twilio account keep its token, with the eye fetching it', async () => {
    gql.reveal.mockResolvedValue({ data: { revealCallingBotSecret: 'saved-twilio' } });
    renderForm(
      configRow({
        phoneProvider: CallingBotPhoneProvider.Twilio,
        twilioAccountSid: `AC${'0f'.repeat(16)}`,
        hasTwilioAuthToken: true,
        twilioNumber: '+14155550100',
      }),
    );
    await press('Show Twilio Auth Token');
    await waitFor(() =>
      expect(screen.getByLabelText('Twilio Auth Token')).toHaveValue('saved-twilio'),
    );
    expect(gql.reveal).toHaveBeenCalledWith({
      variables: { id: 'cfg-1', secret: CallingBotSecret.TwilioAuthToken },
    });
  });

  it('lets a saved Vobiz account keep its token', async () => {
    renderForm(
      configRow({
        phoneProvider: CallingBotPhoneProvider.Vobiz,
        vobizAuthId: 'MA123',
        hasVobizAuthToken: true,
        vobizNumber: '+918012345678',
      }),
    );
    // The Sarvam, OpenAI and Vobiz keys are all saved; each says the eye can show it.
    expect(
      screen.getAllByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toHaveLength(3);
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      phoneProvider: CallingBotPhoneProvider.Vobiz,
      vobizAuthId: 'MA123',
      vobizAuthToken: '',
      vobizNumber: '+918012345678',
    });
  });
});
