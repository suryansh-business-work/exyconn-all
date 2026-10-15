import type { FilterQuery } from 'mongoose';
import type { Channel } from '@exyconn/wa-flow';
import { WhatsappDemoModel, type WhatsappDemoDocument } from './whatsappDemo.model';

/**
 * The demos of one channel. A WhatsApp filter also matches rows stored before channels
 * existed (no `channel` field), which were all WhatsApp demos.
 */
export function channelFilter(channel: Channel): FilterQuery<WhatsappDemoDocument> {
  return channel === 'whatsapp' ? { channel: { $in: ['whatsapp', null] } } : { channel };
}

/**
 * Matches the demo keys analytics rows carry for one channel. Rows name demos by key, so the
 * website's own keys are looked up: the website channel is those keys, and WhatsApp is every
 * other key — rows recorded before channels existed stay WhatsApp's.
 */
export async function demoKeyMatch(
  channel: Channel,
): Promise<{ $in: string[] } | { $nin: string[] }> {
  const website = await WhatsappDemoModel.find(channelFilter('website')).select('key').lean();
  const keys = website.map((demo) => demo.key);
  return channel === 'website' ? { $in: keys } : { $nin: keys };
}
