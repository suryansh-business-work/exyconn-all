import { runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { isEmailAddress } from '../../../utils/emailAddress';
import { isValidTimezone } from '../../../utils/timezone';
import { logger } from '../../../utils/logger';
import { OrganizationModel } from '../../organizations/organization.model';
import { BrandingModel } from '../../branding';
import {
  contactByEmail,
  findOrCreateContact,
  logContactActivity,
  type ContactRef,
} from '../contact.upsert';
import { systemOrigin } from '../crm.origin';
import { MeetingBookingModel, MeetingTypeModel, type MeetingTypeDocument } from './meeting.models';
import { meetingSettings, type MeetingSettings } from './meeting.settings';
import { announceBooking, joinLines } from './meeting.notify';
import { countryOfZone, recordVisit } from './meeting.visits';
import { freeSlots } from './meeting.slots';

const MAX_RANGE_DAYS = 62;
const DAY = 24 * 60 * 60 * 1000;
const DUPLICATE_KEY = 11000;

type MeetingTypeRow = MeetingTypeDocument & { _id: unknown };

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  logoDarkUrl: string;
}

/** Where a public booking address points: /organization/<org>/book/<page>[/<meeting>]. */
export interface BookingAddress {
  org: string;
  page: string;
}

/**
 * The company a booking page belongs to, by the address: its slug, and the booking page's own
 * part, which must be the one chosen in Meeting settings (an old one stops working).
 */
async function companyAt({ org, page }: BookingAddress): Promise<PublicCompany> {
  const company = await runAsPlatform(() =>
    OrganizationModel.findOne({ slug: org.trim().toLowerCase() }).select('name slug').lean(),
  );
  if (!company) notFound('Booking page');
  const id = String(company._id);
  const [settings, brand] = await runForOrganization(id, () =>
    Promise.all([
      meetingSettings(),
      BrandingModel.findOne({ key: 'global' }).select('logoUrl logoDarkUrl').lean(),
    ]),
  );
  if (settings.bookingSlug !== page.trim().toLowerCase()) notFound('Booking page');
  return {
    id,
    name: company.name,
    slug: company.slug,
    logoUrl: brand?.logoUrl ?? '',
    logoDarkUrl: brand?.logoDarkUrl ?? '',
  };
}

/** The active meeting type behind a public link, and its company. */
async function publicType(
  at: BookingAddress,
  slug: string,
): Promise<{ type: MeetingTypeRow; company: PublicCompany }> {
  const company = await companyAt(at);
  const type = await runForOrganization(company.id, () =>
    MeetingTypeModel.findOne({
      slug: slug.trim().toLowerCase(),
      active: true,
    }).lean<MeetingTypeRow>(),
  );
  if (!type) notFound('Meeting');
  return { type, company };
}

/** What the booking page shows before anything is booked: never the location or host's email. */
const present = (type: MeetingTypeRow) => ({
  slug: type.slug,
  title: type.title,
  description: type.description,
  durationMinutes: type.durationMinutes,
  hostName: type.hostName,
  timezone: type.timezone,
  hasLocation: type.location !== '',
});

const brandOf = (company: PublicCompany) => ({
  organizationName: company.name,
  organizationSlug: company.slug,
  logoUrl: company.logoUrl,
  logoDarkUrl: company.logoDarkUrl,
});

export async function publicMeeting(at: BookingAddress, slug: string) {
  const { type, company } = await publicType(at, slug);
  return { ...present(type), ...brandOf(company) };
}

/** A company's booking page: every meeting it takes bookings for. */
export async function publicBookingPage(at: BookingAddress) {
  const company = await companyAt(at);
  const types = await runForOrganization(company.id, () =>
    MeetingTypeModel.find({ active: true }).sort({ createdAt: 1 }).lean<MeetingTypeRow[]>(),
  );
  return {
    ...brandOf(company),
    meetings: types.map((type) => ({ ...present(type), ...brandOf(company) })),
  };
}

/** Counts a visit to the booking page ('' slug) or to one meeting's page. */
export async function trackMeetingView(at: BookingAddress, slug: string, zone?: string | null) {
  const company = await companyAt(at);
  await runForOrganization(company.id, () => recordVisit('VIEW', slug.trim().toLowerCase(), zone));
  return true;
}

/**
 * The host's confirmed meetings near a period, across all their meeting types — widened by
 * the buffer, so a meeting just outside the period still keeps its gap.
 */
const busyFor = (
  type: Pick<MeetingTypeDocument, 'hostUserId' | 'bufferMinutes'>,
  from: Date,
  to: Date,
) => {
  const buffer = type.bufferMinutes * 60_000;
  return MeetingBookingModel.find({
    hostUserId: type.hostUserId,
    status: 'CONFIRMED',
    startAt: { $lt: new Date(to.getTime() + buffer) },
    endAt: { $gt: new Date(from.getTime() - buffer) },
  })
    .select('startAt endAt')
    .lean();
};

export async function publicSlots(
  at: BookingAddress,
  slug: string,
  from: Date,
  to: Date,
): Promise<Date[]> {
  if (to.getTime() <= from.getTime() || to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY) {
    badRequest(`Ask for at most ${MAX_RANGE_DAYS} days at a time.`);
  }
  const { type, company } = await publicType(at, slug);
  const busy = await runForOrganization(company.id, () => busyFor(type, from, to));
  return freeSlots(type, from, to, busy);
}

export interface BookMeetingInput {
  startAt: Date;
  name: string;
  email: string;
  notes?: string | null;
  timezone?: string | null;
  /** Others the booker invites; each gets the confirmation too. */
  guests?: string[] | null;
}

const MAX_GUESTS = 10;

/** The booker's details, tidied and checked before anything is written. */
function checkedBooker(input: BookMeetingInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name === '' || name.length > 120 || !isEmailAddress(email)) {
    badRequest('Enter your name and a valid email address.');
  }
  const guests = [
    ...new Set((input.guests ?? []).map((g) => g.trim().toLowerCase()).filter(Boolean)),
  ];
  if (guests.length > MAX_GUESTS || guests.some((guest) => !isEmailAddress(guest))) {
    badRequest(`Add up to ${MAX_GUESTS} guests, each with a valid email address.`);
  }
  return {
    name,
    email,
    guests,
    timezone: input.timezone && isValidTimezone(input.timezone) ? input.timezone : 'UTC',
    notes: (input.notes ?? '').trim().slice(0, 2000),
  };
}

type Booker = ReturnType<typeof checkedBooker>;

/**
 * Files the meeting on the CRM: on the booker's contact (found by any of their addresses, or
 * created "Meeting booking"), and on every guest who is already a contact.
 */
async function fileOnContacts(type: MeetingTypeRow, booker: Booker, startAt: Date) {
  const contact = await findOrCreateContact({
    name: booker.name,
    email: booker.email,
    leadSource: 'Meeting booking',
    origin: systemOrigin('MEETING_BOOKING'),
  });
  const notes = [
    booker.notes || 'Booked from the public booking link',
    booker.guests.length > 0 ? `Guests: ${booker.guests.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const activity = {
    type: 'MEETING' as const,
    dueDate: startAt,
    done: false,
    owner: type.hostName,
  };
  await logContactActivity(contact, {
    ...activity,
    subject: `${type.title} with ${booker.name}`,
    notes,
  });
  const guests = await Promise.all(booker.guests.map(contactByEmail));
  await Promise.all(
    guests
      .filter((guest): guest is ContactRef => guest !== null && guest.id !== contact.id)
      .map((guest) =>
        logContactActivity(guest, {
          ...activity,
          subject: `${type.title} with ${booker.name} (guest)`,
          notes,
        }),
      ),
  );
  return contact;
}

/** Holds the start: a unique index means two people can never take the same one. */
async function holdSlot(
  type: MeetingTypeRow,
  booker: Booker,
  times: { startAt: Date; endAt: Date },
  contactId: string,
) {
  try {
    await MeetingBookingModel.create({
      meetingTypeId: String(type._id),
      meetingTitle: type.title,
      hostUserId: type.hostUserId,
      hostName: type.hostName,
      ...times,
      name: booker.name,
      email: booker.email,
      notes: booker.notes,
      timezone: booker.timezone,
      country: countryOfZone(booker.timezone),
      guests: booker.guests,
      contactId,
    });
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      badRequest('That time was just taken. Pick another.');
    }
    throw error;
  }
}

const bookedResult = (
  type: MeetingTypeRow,
  times: { startAt: Date; endAt: Date },
  settings: MeetingSettings,
) => ({
  title: type.title,
  hostName: type.hostName,
  ...times,
  location: type.location,
  joinLinks: joinLines(settings),
});

/**
 * Books a free start for the person: checked against the live availability, held by a unique
 * index, filed on their CRM contact as a Meeting activity, counted for tracking, and announced
 * by email (with the Meet/Zoom room from Meeting settings) and on Slack.
 */
export async function bookMeeting(at: BookingAddress, slug: string, input: BookMeetingInput) {
  const booker = checkedBooker(input);
  const { type, company } = await publicType(at, slug);
  const startAt = new Date(input.startAt);
  const times = { startAt, endAt: new Date(startAt.getTime() + type.durationMinutes * 60_000) };
  return runForOrganization(company.id, async () => {
    const busy = await busyFor(type, times.startAt, times.endAt);
    const free = freeSlots(type, times.startAt, times.endAt, busy).some(
      (slot) => slot.getTime() === startAt.getTime(),
    );
    if (!free) {
      badRequest('That time is no longer free. Pick another.');
    }
    const settings = await meetingSettings();
    const contact = await fileOnContacts(type, booker, startAt);
    await holdSlot(type, booker, times, contact.id);
    recordVisit('BOOKED', type.slug, booker.timezone).catch((error: unknown) =>
      logger.warn({ err: error }, 'Meeting booking was not counted'),
    );
    announceBooking(
      {
        title: type.title,
        durationMinutes: type.durationMinutes,
        hostName: type.hostName,
        hostEmail: type.hostEmail,
        location: type.location,
        hostZone: type.timezone,
        startAt,
        ...booker,
      },
      settings,
    );
    return bookedResult(type, times, settings);
  });
}
