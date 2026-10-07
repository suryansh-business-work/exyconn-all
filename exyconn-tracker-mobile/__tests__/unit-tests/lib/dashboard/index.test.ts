import { describe, expect, it } from 'vitest';
import * as dashboard from '../../../../src/lib/dashboard';
import { dayFigures } from '../../../../src/lib/dashboard/day-progress';
import { presenceCaption } from '../../../../src/lib/dashboard/presence-text';
import { sessionTiles } from '../../../../src/lib/dashboard/session-tiles';
import { syncPendingText, syncPolicyText } from '../../../../src/lib/dashboard/sync-text';
import { NO_TICKET, ticketOptions } from '../../../../src/lib/dashboard/ticket-options';
import { totalTiles } from '../../../../src/lib/dashboard/total-tiles';

describe('the dashboard entry point', () => {
  it('exposes each builder from its own module, unchanged', () => {
    expect(dashboard.sessionTiles).toBe(sessionTiles);
    expect(dashboard.totalTiles).toBe(totalTiles);
    expect(dashboard.dayFigures).toBe(dayFigures);
    expect(dashboard.syncPolicyText).toBe(syncPolicyText);
    expect(dashboard.syncPendingText).toBe(syncPendingText);
    expect(dashboard.presenceCaption).toBe(presenceCaption);
    expect(dashboard.ticketOptions).toBe(ticketOptions);
    expect(dashboard.NO_TICKET).toBe(NO_TICKET);
  });
});
