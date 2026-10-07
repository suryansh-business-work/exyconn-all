import { describe, expect, it } from 'vitest';
import { events } from '../../../src/seeds/events';
import { checkSeedDeep } from './check-seed-deep';

describe('events seed', () => {
  checkSeedDeep(events, ['book-tickets', 'workshop', 'plan-event', 'my-tickets', 'event-alerts']);

  it('is the Spotlight Live demo', () => {
    expect(events.business.name).toBe('Spotlight Live');
  });
});
