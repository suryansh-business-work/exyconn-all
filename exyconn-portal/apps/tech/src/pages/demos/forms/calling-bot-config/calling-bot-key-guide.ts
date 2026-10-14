/**
 * Where each calling bot key comes from: the console to open and what to do there. Shown
 * above the form and linked from each key's field, so whoever sets the bot up never has to
 * search for it.
 */
export interface KeySource {
  /** Which fields of the form this source fills in. */
  fields: readonly string[];
  provider: string;
  url: string;
  urlLabel: string;
  steps: readonly string[];
}

export const SARVAM_SOURCE: KeySource = {
  fields: ['Sarvam AI key'],
  provider: 'Sarvam AI (listens and speaks)',
  url: 'https://dashboard.sarvam.ai',
  urlLabel: 'dashboard.sarvam.ai',
  steps: [
    'Sign up or sign in at dashboard.sarvam.ai. New accounts get free credits.',
    'Open API Keys and create a new key.',
    'Copy it straight away: Sarvam shows a key only once. Paste it into Sarvam AI key.',
  ],
};

export const OPENAI_SOURCE: KeySource = {
  fields: ['OpenAI key'],
  provider: 'OpenAI (thinks of the reply)',
  url: 'https://platform.openai.com/api-keys',
  urlLabel: 'platform.openai.com/api-keys',
  steps: [
    'Sign in at platform.openai.com and open API keys.',
    'Choose Create new secret key, name it, e.g. "Exyconn calling bot", and copy it. It starts with sk- and is shown only once.',
    'Make sure the account has credit under Settings > Billing, or every call fails.',
  ],
};

export const VOBIZ_SOURCE: KeySource = {
  fields: ['Vobiz Auth ID', 'Vobiz Auth Token', 'Calling number'],
  provider: 'Vobiz (rings real phones, optional)',
  url: 'https://console.vobiz.ai',
  urlLabel: 'console.vobiz.ai',
  steps: [
    'Sign up at console.vobiz.ai and finish the account checks Vobiz asks for.',
    'Copy the Auth ID and Auth Token from your API credentials in the console.',
    'Buy a phone number under Phone Numbers and enter it in E.164, e.g. +918012345678.',
    'Add balance to the account, then choose Vobiz as the phone provider below.',
  ],
};

export const TWILIO_SOURCE: KeySource = {
  fields: ['Twilio Account SID', 'Twilio Auth Token', 'Calling number'],
  provider: 'Twilio (rings real phones, optional)',
  url: 'https://console.twilio.com',
  urlLabel: 'console.twilio.com',
  steps: [
    'Sign in at console.twilio.com. The Account SID (starts with AC) and Auth Token are under Account Info on the dashboard.',
    'Buy a voice-capable number under Phone Numbers > Manage > Buy a number, and enter it in E.164.',
    'Allow the countries you will call under Voice > Settings > Geo permissions, e.g. India.',
    'A trial account calls only numbers listed under Verified Caller IDs and plays a trial notice first; upgrade to call anyone.',
  ],
};

export const KEY_SOURCES: readonly KeySource[] = [
  SARVAM_SOURCE,
  OPENAI_SOURCE,
  VOBIZ_SOURCE,
  TWILIO_SOURCE,
];
