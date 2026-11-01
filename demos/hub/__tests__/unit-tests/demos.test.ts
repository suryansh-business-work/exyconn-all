import { describe, expect, it } from 'vitest';
import { appBaseUrl, PORTAL_APPS } from '@exyconn/shell/config/apps';
import { DEMO_PHOTOS, shortTitle } from '@exyconn/demo-visitor/page';
import { DEMOS } from '../../src/demos';

describe('the demos the hub lists', () => {
  it('lists every demo with a card look, in registry order, and nothing else', () => {
    const keys = DEMOS.map((demo) => demo.key);
    expect([...keys].sort((a, b) => a.localeCompare(b))).toEqual([
      'calling-bot-demo',
      'mcp-sandbox-demo',
      'meeting-bot-demo',
      'website-chat-demo',
      'whatsapp-demo',
    ]);
    const registryOrder = Object.keys(PORTAL_APPS).filter((key) => keys.includes(key as never));
    expect(keys).toEqual(registryOrder);
  });

  it('takes each title, description and address from the app registry', () => {
    const calling = DEMOS.find((demo) => demo.key === 'calling-bot-demo');
    expect(calling).toMatchObject({
      title: shortTitle(PORTAL_APPS['calling-bot-demo'].title),
      description: PORTAL_APPS['calling-bot-demo'].description,
      url: appBaseUrl('calling-bot-demo'),
      photo: DEMO_PHOTOS.caller,
    });
    expect(calling?.highlights).toHaveLength(3);
  });
});
