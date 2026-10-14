import type { DemoRow } from '../../../../../src/admin/workflows/model/api';

/** A stored demo as `whatsappDemos` returns it. */
export function demoRow(overrides: Partial<DemoRow> = {}): DemoRow {
  return {
    __typename: 'WhatsappDemo',
    id: 'demo-1',
    key: 'clinic',
    industry: 'Healthcare',
    business: {
      name: 'City Clinic',
      tagline: 'Care close to home',
      category: 'Clinic',
      about: '',
      icon: 'business',
      accent: 'teal',
      verified: true,
      phone: '+91 90000 00000',
      email: 'desk@clinic.example',
      website: 'https://clinic.example',
      address: '',
      hours: '9 to 5',
    },
    greeting: 'Hi {{user.firstName}}',
    menuText: 'How can we help?',
    menuButton: 'View options',
    order: 1,
    active: true,
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}
