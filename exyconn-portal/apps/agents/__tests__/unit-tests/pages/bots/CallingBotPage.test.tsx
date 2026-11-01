import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CALLING_BOT_PATH, CallingBotPage } from '../../../../src/pages/bots/CallingBotPage';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/bots/CallingBotConfigsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('CallingBotConfigsPanel'),
);
vi.mock('../../../../src/pages/bots/CallingBotScenariosPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('CallingBotScenariosPanel'),
);
vi.mock('../../../../src/pages/bots/CallingBotCallsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('CallingBotCallsPanel'),
);
vi.mock('../../../../src/pages/bots/call-flows/CallFlowsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('CallFlowsPanel'),
);

describe('CallingBotPage', () => {
  it('lives under /agents/calling-bot with its four tabs, settings first', async () => {
    expect(CALLING_BOT_PATH).toBe('/agents/calling-bot');
    renderWithProviders(<CallingBotPage />, { route: CALLING_BOT_PATH });
    expect(await screen.findByTestId('CallingBotConfigsPanel')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Calling bot' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Settings',
      'Examples',
      'Call flows',
      'Calls',
    ]);
  });

  it.each([
    ['examples', 'CallingBotScenariosPanel'],
    ['call-flows', 'CallFlowsPanel'],
    ['calls', 'CallingBotCallsPanel'],
  ])('shows the %s tab at its own address', (slug, panel) => {
    renderWithProviders(<CallingBotPage />, { route: `${CALLING_BOT_PATH}/${slug}` });
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByTestId(panel));
    expect(screen.queryByTestId('CallingBotConfigsPanel')).not.toBeInTheDocument();
  });
});
