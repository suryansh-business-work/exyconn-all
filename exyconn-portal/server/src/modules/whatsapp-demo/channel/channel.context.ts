import { formatInTimeZone } from 'date-fns-tz';
import type { DemoUser, EngineContext } from '@exyconn/wa-flow/engine';
import { AppSettingsModel } from '../../admin/settings.model';
import { readBundle } from '../../i18n';
import { companyProfile } from '../../../lib/company';
import { aiStatus } from '../whatsappDemo.parse';

/**
 * The engine context for a chat on the real number, built the way the browser chat builds
 * its own: the workspace's date and time patterns and timezone (Admin > Settings), the
 * company's language with the server's translations first and the English source as the
 * fallback, and the WhatsApp sender as `{{user.*}}`.
 */

/** Demo prices are written in rupees, whatever currency the company books in. */
const DEMO_CURRENCY = 'INR';

export interface Sender {
  waId: string;
  name: string;
}

function demoUser(sender: Sender): DemoUser {
  const fullName = sender.name.trim();
  return {
    firstName: fullName.split(/\s+/)[0] ?? '',
    fullName,
    email: '',
    phone: `+${sender.waId}`,
  };
}

async function translator(locale: string): Promise<(source: string) => string> {
  const entries = await readBundle(locale);
  const texts = new Map(entries.map((entry) => [entry.source, entry.text]));
  return (source) => texts.get(source) ?? source;
}

export async function engineContext(sender: Sender): Promise<EngineContext> {
  const [settings, company, ai] = await Promise.all([
    AppSettingsModel.findOne({ key: 'global' }).lean(),
    companyProfile(),
    aiStatus(),
  ]);
  const locale = settings?.defaultLocale ?? company.locale;
  const timezone = settings?.timezone ?? company.timezone;
  // No settings row yet means nobody has changed the defaults, which are these.
  const dateFormat = settings?.dateFormat ?? 'dd MMM yyyy';
  const timeFormat = settings?.timeFormat ?? 'hh:mm a';
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: DEMO_CURRENCY,
    maximumFractionDigits: 0,
  });
  const day = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  });
  return {
    now: Date.now(),
    user: demoUser(sender),
    t: await translator(locale),
    ai: ai.configured,
    // WhatsApp shows no typing delay of ours; replies go out as soon as they are ready.
    typingScale: 0,
    format: {
      date: (ms) => formatInTimeZone(ms, timezone, dateFormat),
      time: (ms) => formatInTimeZone(ms, timezone, timeFormat),
      day: (ms) => day.format(ms),
      money: (rupees) => money.format(rupees),
    },
  };
}
