import type { PendingPush } from '@exyconn/wa-flow';
import { plan } from '../../../../../src/modules/whatsapp-demo/channel/channel.plan';
import { INDUSTRIES } from '../../../../../src/modules/whatsapp-demo/channel/channel.industries';
import { chatRecord, demoBundle, option } from './channel.fixtures';

const salon = demoBundle('salon', 'Salon');
const clinic = demoBundle('clinic', 'Clinic');
const bundles = [salon, clinic];

const push = (demoKey: string): PendingPush => ({
  id: 'push-1',
  demoKey,
  workflow: 'booking',
  node: 'remind',
  at: 1_000,
});

describe('plan: a tapped button or row', () => {
  const book = option('book');
  const pick = option('pick', { workflow: INDUSTRIES, node: 'pick', handle: 'clinic' });
  const more = option('more', { workflow: INDUSTRIES, node: 'page', handle: '1' });
  const options = { o1: book, o2: pick, o3: more };

  it('asks the industry for its menu when the option is too old to remember', () => {
    const chat = chatRecord({ demoKey: 'salon', options });
    expect(plan({ kind: 'reply', id: 'gone' }, chat, bundles)).toEqual({
      kind: 'engine',
      bundle: salon,
      event: { type: 'text', text: 'menu' },
    });
  });

  it('shows the picker for a forgotten option when no industry is chosen', () => {
    const chat = chatRecord({ options });
    expect(plan({ kind: 'reply', id: 'gone' }, chat, bundles)).toEqual({ kind: 'picker', page: 0 });
  });

  it('starts the industry a picker row names, even from inside another one', () => {
    const chat = chatRecord({ demoKey: 'salon', options });
    expect(plan({ kind: 'reply', id: 'o2' }, chat, bundles)).toEqual({
      kind: 'start',
      demoKey: 'clinic',
    });
  });

  it('turns to the page a "More industries" row asks for', () => {
    const chat = chatRecord({ options });
    expect(plan({ kind: 'reply', id: 'o3' }, chat, bundles)).toEqual({ kind: 'picker', page: 1 });
  });

  it('plays an ordinary option through the engine as a choice', () => {
    const chat = chatRecord({ demoKey: 'salon', options });
    expect(plan({ kind: 'reply', id: 'o1' }, chat, bundles)).toEqual({
      kind: 'engine',
      bundle: salon,
      event: { type: 'choice', option: book, quoted: '' },
    });
  });

  it('shows the picker for an ordinary option once its industry is unpublished', () => {
    const chat = chatRecord({ demoKey: 'retired', options });
    expect(plan({ kind: 'reply', id: 'o1' }, chat, bundles)).toEqual({ kind: 'picker', page: 0 });
  });
});

describe('plan: typed text', () => {
  it('brings the picker back for a switch word, inside an industry or not', () => {
    expect(
      plan({ kind: 'text', text: 'Industries' }, chatRecord({ demoKey: 'salon' }), bundles),
    ).toEqual({ kind: 'picker', page: 0 });
    expect(plan({ kind: 'text', text: 'switch' }, chatRecord(), bundles)).toEqual({
      kind: 'picker',
      page: 0,
    });
  });

  it('passes text inside an industry to the engine', () => {
    expect(
      plan({ kind: 'text', text: 'book a cut' }, chatRecord({ demoKey: 'salon' }), bundles),
    ).toEqual({ kind: 'engine', bundle: salon, event: { type: 'text', text: 'book a cut' } });
  });

  it('starts the industry a first message names, as a wa.me link prefills', () => {
    expect(plan({ kind: 'text', text: 'Clinic' }, chatRecord(), bundles)).toEqual({
      kind: 'start',
      demoKey: 'clinic',
    });
  });

  it('shows the picker for any other first message', () => {
    expect(plan({ kind: 'text', text: 'hello' }, chatRecord(), bundles)).toEqual({
      kind: 'picker',
      page: 0,
    });
  });
});

describe('plan: a reminder now due', () => {
  it('plays a reminder from the industry the chat is in', () => {
    const due = push('salon');
    expect(plan({ kind: 'push', push: due }, chatRecord({ demoKey: 'salon' }), bundles)).toEqual({
      kind: 'engine',
      bundle: salon,
      event: { type: 'push', push: due },
    });
  });

  it('drops a reminder from an industry the chat has left', () => {
    expect(
      plan({ kind: 'push', push: push('salon') }, chatRecord({ demoKey: 'clinic' }), bundles),
    ).toEqual({ kind: 'ignore' });
  });

  it('drops a reminder when the chat is in no published industry', () => {
    expect(plan({ kind: 'push', push: push('salon') }, chatRecord(), bundles)).toEqual({
      kind: 'ignore',
    });
  });
});
