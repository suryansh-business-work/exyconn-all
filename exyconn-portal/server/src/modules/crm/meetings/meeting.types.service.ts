import { badRequest, notFound } from '../../../utils/errors';
import { isValidTimezone } from '../../../utils/timezone';
import { runAsPlatform } from '../../../lib/tenant';
import { isSlug, SLUG_RULE } from './meeting.slug';
import { MeetingTypeModel, type MeetingTypeDocument } from './meeting.models';

export interface MeetingTypeInput {
  title: string;
  slug: string;
  description?: string | null;
  durationMinutes: number;
  location?: string | null;
  timezone: string;
  weeklyHours: Array<{ day: number; enabled: boolean; start: string; end: string }>;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  active: boolean;
}

export interface MeetingHost {
  id: string;
  name: string;
  email: string;
}

/** "HH:mm" on a 24-hour clock. */
const isClock = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return value.length === 5 && h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

/** Refuses what the public page could not honour, in words the editor can act on. */
function checked(input: MeetingTypeInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!isSlug(slug)) {
    badRequest(`${SLUG_RULE} for the link.`);
  }
  if (!isValidTimezone(input.timezone)) {
    badRequest('Pick a time zone from the list.');
  }
  const days = new Set<number>();
  for (const hours of input.weeklyHours) {
    if (days.has(hours.day) || hours.day < 0 || hours.day > 6) {
      badRequest('Each weekday can appear once.');
    }
    days.add(hours.day);
    if (
      hours.enabled &&
      (!isClock(hours.start) || !isClock(hours.end) || hours.start >= hours.end)
    ) {
      badRequest('Each available day needs a start before its end.');
    }
  }
  if (!input.weeklyHours.some((hours) => hours.enabled)) {
    badRequest('Make at least one day available.');
  }
  return {
    ...input,
    slug,
    title: input.title.trim(),
    description: input.description ?? '',
    location: input.location ?? '',
  };
}

/** Links are global, so a slug another company uses is refused before the unique index is. */
async function assertSlugFree(slug: string, exceptId?: string) {
  const taken = await runAsPlatform(() =>
    MeetingTypeModel.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }),
  );
  if (taken) {
    badRequest('That link is taken. Choose another.');
  }
}

export const meetingTypes = {
  list: () => MeetingTypeModel.find().sort({ createdAt: -1 }).lean(),

  async create(input: MeetingTypeInput, host: MeetingHost) {
    const fields = checked(input);
    await assertSlugFree(fields.slug);
    const doc = await MeetingTypeModel.create({
      ...fields,
      hostUserId: host.id,
      hostName: host.name,
      hostEmail: host.email,
    });
    return doc.toObject();
  },

  async update(id: string, input: MeetingTypeInput) {
    const fields = checked(input);
    await assertSlugFree(fields.slug, id);
    const doc = await MeetingTypeModel.findByIdAndUpdate(id, fields, {
      new: true,
      runValidators: true,
    }).lean<MeetingTypeDocument & { _id: unknown }>();
    if (!doc) notFound('Meeting type');
    return doc;
  },

  async remove(id: string) {
    const doc = await MeetingTypeModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Meeting type');
    return true;
  },
};
