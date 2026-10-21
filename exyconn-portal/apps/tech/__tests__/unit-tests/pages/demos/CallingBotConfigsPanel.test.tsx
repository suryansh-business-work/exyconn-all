import { beforeEach, describe, it, vi } from 'vitest';
import { CallingBotPhoneProvider } from '@exyconn/shell/graphql/generated';
import { CallingBotConfigsPanel } from '../../../../src/pages/demos/CallingBotConfigsPanel';
import { configPanelSuite } from '../environment-variables/config-panel.suite';
import { configRow } from './calling-bot.fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCallingBotConfigsQuery: gql.list,
  useDeleteCallingBotConfigMutation: () => [gql.remove],
  useTestCallingBotConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () =>
  (await import('../environment-variables/panel.harness')).crudModule(),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../environment-variables/panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../environment-variables/panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/demos/forms/calling-bot-config', async () =>
  (await import('../environment-variables/panel.harness')).formModule('CallingBotConfigForm'),
);

const suite = configPanelSuite({
  name: 'CallingBotConfigsPanel',
  Panel: CallingBotConfigsPanel,
  listQuery: gql.list,
  listKey: 'callingBotConfigs',
  rows: [
    configRow({ phoneEnabled: true, phoneProvider: CallingBotPhoneProvider.Vobiz }),
    configRow({
      id: 'cfg-2',
      label: 'Twilio bot',
      languageCode: 'en-IN',
      ttsSpeaker: 'shubh',
      openAiModel: 'gpt-4.1-mini',
      hasSarvamApiKey: false,
      sarvamApiKeyHint: null,
      phoneProvider: CallingBotPhoneProvider.Twilio,
      phoneEnabled: true,
      isActive: false,
    }),
    configRow({ id: 'cfg-3', label: 'Browser bot', sarvamApiKeyHint: null }),
  ],
  cells: {
    'cfg-1': ['Clinic bot', 'hi-IN', 'vidya', 'gpt-4o-mini', '••••k9z1', 'Vobiz', 'ACTIVE'],
    'cfg-2': ['Twilio bot', 'en-IN', 'shubh', 'gpt-4.1-mini', '—', 'Twilio', 'INACTIVE'],
    'cfg-3': ['Browser bot', '••••', 'Browser only'],
  },
  deleteMutation: gql.remove,
  label: 'Calling bot config',
  confirm: 'Delete calling bot config "{label}"?',
  title: 'Calling bot',
  actionLabel: 'New calling bot config',
  emptyMessage: 'No calling bot config yet.',
  form: 'CallingBotConfigForm',
  newTitle: 'New calling bot config',
  editTitle: 'Edit calling bot config',
  backLabel: 'Back to Calling bot',
  connection: {
    ariaLabel: 'test calling bot keys',
    mutation: gql.test,
    success: ['OpenAI and Sarvam AI accepted "{label}"', 'success', { label: 'Clinic bot' }],
  },
});

describe('CallingBotConfigsPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});
