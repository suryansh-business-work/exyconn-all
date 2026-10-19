import { describe, expect, it } from 'vitest';
import { PORTAL_APPS, appBaseUrl } from '@exyconn/shell/config/apps';
import { ALL_DEMOS_URL, DEMO_LINKS, shortTitle } from '../../../src/page/demoLinks';

describe('demoLinks', () => {
  it('drops the brand suffix from a registry title', () => {
    expect(shortTitle('WhatsApp Demo · Exyconn')).toBe('WhatsApp Demo');
    expect(shortTitle('  Calling Bot  ')).toBe('Calling Bot');
    expect(shortTitle('')).toBe('');
  });

  it('lists the three demos in site order, named and addressed by the app registry', () => {
    expect(DEMO_LINKS.map((demo) => demo.key)).toEqual([
      'calling-bot-demo',
      'whatsapp-demo',
      'website-chat-demo',
    ]);
    for (const demo of DEMO_LINKS) {
      expect(demo.label).toBe(shortTitle(PORTAL_APPS[demo.key].title));
      expect(demo.label).not.toContain('·');
      expect(demo.url).toBe(appBaseUrl(demo.key));
    }
  });

  it('points "all demos" at the demos landing page', () => {
    expect(ALL_DEMOS_URL).toBe(appBaseUrl('demos'));
  });
});
