import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CallingBotScenariosPanel } from '../../../../src/pages/demos/CallingBotScenariosPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from '../environment-variables/config-panel.suite';
import {
  crudState,
  propsOf,
  resetHarness,
  resourceOptions,
} from '../environment-variables/panel.harness';
import { scenarioRow } from './calling-bot.fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCallingBotScenariosQuery: gql.list,
  useDeleteCallingBotScenarioMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () =>
  (await import('../environment-variables/panel.harness')).crudModule(),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../environment-variables/panel.harness')).dataTableModule(),
);
vi.mock('../../../../src/pages/demos/forms/calling-bot-scenario', async () =>
  (await import('../environment-variables/panel.harness')).formModule('CallingBotScenarioForm'),
);

const ROWS = [
  scenarioRow(),
  scenarioRow({
    id: 'sc-2',
    title: 'Loan reminder',
    description: 'An EMI is due on the fifth.',
    languageCode: 'ta-IN',
    enabled: false,
    order: 40,
  }),
];

describeConfigPanel({
  name: 'CallingBotScenariosPanel',
  Panel: CallingBotScenariosPanel,
  listQuery: gql.list,
  listKey: 'callingBotScenarios',
  rows: ROWS,
  cells: {
    'sc-1': ['10', 'Clinic booking', 'Book a dental check-up for next week.', 'Settings', 'ACTIVE'],
    'sc-2': ['40', 'Loan reminder', 'An EMI is due on the fifth.', 'ta-IN', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Calling bot example',
  confirm: 'Delete the example "{title}"?',
  confirmValues: { title: 'Clinic booking' },
  title: 'Examples',
  actionLabel: 'New example',
  emptyMessage: 'No examples yet.',
  form: 'CallingBotScenarioForm',
  newTitle: 'New example',
  editTitle: 'Edit example',
  backLabel: 'Back to Examples',
});

describe('CallingBotScenariosPanel — where a new example goes', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    resetHarness();
    crudState.open = true;
  });

  it('places it ten after the last example, keeping its own ?form scope', () => {
    gql.list.mockReturnValue({ data: { callingBotScenarios: ROWS }, loading: false, refetch });
    renderWithProviders(<CallingBotScenariosPanel />);
    expect(propsOf('CallingBotScenarioForm').nextOrder).toBe(50);
    expect(resourceOptions()).toMatchObject({ scope: 'example' });
  });

  it('places the first example at 10', () => {
    gql.list.mockReturnValue({ data: undefined, loading: true, refetch });
    renderWithProviders(<CallingBotScenariosPanel />);
    expect(propsOf('CallingBotScenarioForm').nextOrder).toBe(10);
  });
});
