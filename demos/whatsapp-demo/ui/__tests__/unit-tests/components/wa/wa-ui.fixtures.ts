import type { BotContent, ChatMessage, DemoProfile, UserContent } from '@exyconn/wa-flow';
import type { ChatRecord, ChatStore } from '../../../../src/runtime/store';
import type { CatalogBundle } from '../../../../src/runtime/types';

type Business = DemoProfile['business'];

/** A full business profile; tests override what they look at. */
export function business(overrides: Partial<Business> = {}): Business {
  return {
    name: 'City Clinic',
    tagline: 'Care close to home',
    category: 'Clinic',
    about: 'A family clinic.',
    icon: 'doctor',
    accent: 'teal',
    verified: true,
    phone: '+91 80000 00000',
    email: 'hello@clinic.example',
    website: 'clinic.example',
    address: 'MG Road, Bengaluru',
    hours: 'Mon–Sat 9–6',
    ...overrides,
  };
}

export function demoProfile(
  overrides: Partial<Omit<DemoProfile, 'business'>> = {},
  biz: Partial<Business> = {},
): DemoProfile {
  return {
    key: 'clinic',
    industry: 'Healthcare',
    business: business(biz),
    greeting: 'Welcome',
    menuText: 'Pick one',
    menuButton: 'Menu',
    order: 1,
    active: true,
    ...overrides,
  };
}

export function bundle(
  overrides: Partial<Omit<DemoProfile, 'business'>> = {},
  biz: Partial<Business> = {},
): CatalogBundle {
  return { demo: demoProfile(overrides, biz), workflows: [], revision: 'r1' };
}

export function message(
  id: string,
  at: number,
  content?: BotContent | UserContent,
  from: ChatMessage['from'] = 'bot',
): ChatMessage {
  return { id, from, at, content: content ?? { type: 'text', text: id } };
}

export function chatRecord(demoKey: string, messages: ChatMessage[], unread = 0): ChatRecord {
  return { state: { demoKey, vars: {}, seq: 0, seed: 1 }, messages, unread };
}

export function store(
  chats: Record<string, ChatRecord> = {},
  typing: Record<string, boolean> = {},
): ChatStore {
  return { chats, pending: [], typing };
}
