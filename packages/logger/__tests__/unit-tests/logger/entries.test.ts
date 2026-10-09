import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOG_LIMITS } from '../../../src';
import { setup, storedQueue } from '../helpers';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T09:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createLogger entries', () => {
  it('joins the call-site message and the error text, without repeating either', () => {
    const { logger, storage } = setup();
    logger.error('Saving failed', new Error('offline'));
    logger.warn('Same words', new Error('Same words'));
    logger.warn('', new Error('Only the error'));
    logger.warn('Only the message', new Error(''));
    logger.warn('No detail at all');
    expect(storedQueue(storage).map((entry) => entry.message)).toEqual([
      'Saving failed: offline',
      'Same words',
      'Only the error',
      'Only the message',
      'No detail at all',
    ]);
  });

  it('records "(no message)" when there is nothing to say, and cuts long messages', () => {
    const { logger, storage } = setup();
    logger.capture('');
    logger.info('y'.repeat(LOG_LIMITS.message + 50));
    const [empty, long] = storedQueue(storage);
    expect(empty.message).toBe('(no message)');
    expect(long.message).toHaveLength(LOG_LIMITS.message);
  });

  it('builds a full entry with level, time, count and null fields when nothing is known', () => {
    const { logger, storage } = setup();
    logger.info('Synced', { items: 3 });
    logger.debug('Tick');
    expect(storedQueue(storage)).toEqual([
      {
        level: 'INFO',
        message: 'Synced',
        errorName: null,
        stack: null,
        componentStack: null,
        route: null,
        context: '{"items":3}',
        count: 1,
        occurredAt: '2026-10-07T09:00:00.000Z',
        breadcrumbs: [],
      },
      expect.objectContaining({ level: 'DEBUG', message: 'Tick', context: null }),
    ]);
  });

  it('captures at ERROR by default, or at the level asked, with the component stack', () => {
    const { logger, storage } = setup();
    logger.capture(new TypeError('bad'), { componentStack: '\n  at Settings' });
    logger.capture({ code: 7 }, { level: 'WARN', context: { screen: 'home' } });
    const [first, second] = storedQueue(storage);
    expect(first).toMatchObject({
      level: 'ERROR',
      message: 'bad',
      errorName: 'TypeError',
      componentStack: '\n  at Settings',
    });
    expect(second).toMatchObject({
      level: 'WARN',
      message: '{"code":7}',
      errorName: null,
      context: '{"screen":"home"}',
    });
  });

  it('attaches breadcrumbs only to errors and warnings', () => {
    const { logger, storage } = setup();
    logger.breadcrumb('Tapped save');
    logger.breadcrumb('Server said 500', 'WARN');
    logger.info('Retrying');
    logger.warn('Gave up');
    const [info, warn] = storedQueue(storage);
    expect(info.breadcrumbs).toEqual([]);
    expect(warn.breadcrumbs).toEqual([
      { at: '2026-10-07T09:00:00.000Z', level: 'DEBUG', message: 'Tapped save' },
      { at: '2026-10-07T09:00:00.000Z', level: 'WARN', message: 'Server said 500' },
      { at: '2026-10-07T09:00:00.000Z', level: 'INFO', message: 'Retrying' },
    ]);
  });

  it('keeps the 30 newest breadcrumbs, an empty one as empty text', () => {
    const { logger, storage } = setup();
    for (let i = 0; i < 31; i += 1) {
      logger.breadcrumb(`step ${i}`);
    }
    logger.breadcrumb('');
    logger.error('Crash');
    const crumbs = storedQueue(storage)[0].breadcrumbs.map((crumb) => crumb.message);
    expect(crumbs).toHaveLength(30);
    expect(crumbs[0]).toBe('step 2');
    expect(crumbs.at(-1)).toBe('');
  });

  it('cuts a long breadcrumb to the limit', () => {
    const { logger, storage } = setup();
    logger.breadcrumb('z'.repeat(LOG_LIMITS.breadcrumb + 10));
    logger.error('Crash');
    expect(storedQueue(storage)[0].breadcrumbs[0].message).toHaveLength(LOG_LIMITS.breadcrumb);
  });

  it('stamps the route on entries and notes a route change only once', () => {
    const { logger, storage } = setup();
    logger.setRoute('/home');
    logger.setRoute('/home');
    logger.setRoute('/settings');
    logger.error('Crash');
    const [entry] = storedQueue(storage);
    expect(entry.route).toBe('/settings');
    expect(entry.breadcrumbs.map((crumb) => crumb.message)).toEqual([
      'Opened /home',
      'Opened /settings',
    ]);
  });

  it('treats the same message on another route as a different problem', () => {
    const { logger, storage } = setup();
    logger.warn('Slow');
    logger.setRoute('/other');
    logger.warn('Slow');
    logger.info('Slow');
    expect(storedQueue(storage).map((entry) => entry.count)).toEqual([1, 1, 1]);
  });
});
