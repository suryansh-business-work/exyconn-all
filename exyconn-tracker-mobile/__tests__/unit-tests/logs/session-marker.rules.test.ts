import { describe, expect, it } from 'vitest';
import {
  parseMarker,
  ROUTE_HISTORY,
  unexpectedExitOf,
  withRoute,
  type SessionMarker,
} from '../../../src/lib/logs/session-marker.rules';

const run: SessionMarker = {
  active: true,
  fatal: false,
  startedAt: '2026-09-11T10:00:00.000Z',
  routes: [{ route: '/settings', at: '2026-09-11T10:01:00.000Z' }],
};

describe('unexpectedExitOf', () => {
  it('reports a run that ended on screen, with the screens it had open', () => {
    expect(unexpectedExitOf(run)).toEqual({
      error: expect.objectContaining({ name: 'UnexpectedExit' }),
      context: { lastScreens: run.routes, startedAt: run.startedAt },
    });
  });

  it('owes nothing for a run that went to the background, or whose fatal error was sent', () => {
    expect(unexpectedExitOf({ ...run, active: false })).toBeNull();
    expect(unexpectedExitOf({ ...run, fatal: true })).toBeNull();
    expect(unexpectedExitOf(null)).toBeNull();
  });
});

describe('parseMarker', () => {
  it('reads a stored marker and survives a missing or corrupt file', () => {
    expect(parseMarker(JSON.stringify(run))).toEqual(run);
    expect(parseMarker(null)).toBeNull();
    expect(parseMarker('{half')).toBeNull();
  });
});

describe('withRoute', () => {
  it('keeps only the newest screens', () => {
    let marker: SessionMarker = { ...run, routes: [] };
    for (let i = 0; i < ROUTE_HISTORY + 3; i += 1) {
      marker = withRoute(marker, `/screen-${i}`, run.startedAt);
    }
    expect(marker.routes).toHaveLength(ROUTE_HISTORY);
    expect(marker.routes[0].route).toBe('/screen-3');
  });
});
