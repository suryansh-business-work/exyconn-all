import { runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { isEmailAddress } from '../../../utils/emailAddress';
import { isValidTimezone } from '../../../utils/timezone';
import { logger } from '../../../utils/logger';
import { mailer } from '../../../utils/mailer';
import { ActivityModel } from '../activity.model';
import { ContactModel } from '../contact.model';
import { OrganizationModel } from '../../organizations/organization.model';
import { MeetingBookingModel, MeetingTypeModel, type MeetingTypeDocument } from './meeting.models';
import { freeSlots } from './meeting.slots';

const MAX_RANGE_DAYS = 62;
const DAY = 24 * 60 * 60 * 1000;
const DUPLICATE_KEY = 11000;

type MeetingTypeRow = MeetingTypeDocument & { _id: unknown };

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
}

/** The company a booking page belongs to, by the slug in its address. */
async function companyBySlug(org: string): Promise<PublicCompany> {
  const company = await runAsPlatform(() =>
    OrganizationModel.findOne({ slug: org.trim().toLowerCase() }).select('name slug').lean(),
  );
  if (!company) notFound('Booking page');
  return { id: String(company._id), name: company.name, slug: company.slug };
}

/** The active meeting type behind a public link (/book/<company>/<meeting>), and its company. */
async function publicType(
  org: string,
  slug: string,
): Promise<{ type: MeetingTypeRow; organizationId: string; company: PublicCompany }> {
  const company = await companyBySlug(org);
  const type = await runForOrganization(company.id, () =>
    MeetingTypeModel.findOne({
      slug: slug.trim().toLowerCase(),
      active: true,
    }).lean<MeetingTypeRow>(),
  );
  if (!type) notFound('Meeting');
  return { type, organizationId: company.id, company };
}

/** What the booking page shows before anything is booked: never the location or host's email. */
const present = (type: MeetingTypeRow, company: PublicCompany) => ({
  slug: type.slug,
  title: type.title,
  description: type.description,
  durationMinutes: type.durationMinutes,
  hostName: type.hostName,
  timezone: type.timezone,
  organizationName: company.name,
  organizationSlug: company.slug,
  hasLocation: type.location !== '',
});

export async function publicMeeting(org: string, slug: string) {
  const { type, company } = await publicType(org, slug);
  return present(type, company);
}

/** A company's booking page: every meeting it takes bookings for. */
export async function publicBookingPage(org: string) {
  const company = await companyBySlug(org);
  const types = await runForOrganization(company.id, () =>
    MeetingTypeModel.find({ active: true }).sort({ createdAt: 1 }).lean<MeetingTypeRow[]>(),
  );
  return {
    organizationName: company.name,
    organizationSlug: company.slug,
    meetings: types.map((type) => present(type, company)),
  };
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
  org: string,
  slug: string,
  from: Date,
  to: Date,
): Promise<Date[]> {
  if (to.getTime() <= from.getTime() || to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY) {
    badRequest(`Ask for at most ${MAX_RANGE_DAYS} days at a time.`);
  }
  const { type, organizationId } = await publicType(org, slug);
  const busy = await runForOrganization(organizationId, () => busyFor(type, from, to));
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

/** The person's CRM contact, by any of their addresses; created when there is none. */
async function contactFor(
  name: string,
  email: string,
  owner: string,
): Promise<{ id: string; name: string }> {
  const found = await ContactModel.findOne({ $or: [{ email }, { 'emails.address': email }] })
    .select('name')
    .lean();
  if (found) {
    return { id: String(found._id), name: found.name };
  }
  const created = await ContactModel.create({
    name,
    email,
    emails: [{ address: email, label: 'Work', primary: true }],
    owner,
    leadSource: 'Meeting booking',
  });
  return { id: String(created._id), name };
}

const when = (at: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short', timeZone }).format(at);

/** Confirmation to both sides; a mail failure is logged and never undoes the booking. */
function confirm(
  type: MeetingTypeRow,
  booking: {
    startAt: Date;
    name: string;
    email: string;
    notes: string;
    timezone: string;
    guests: string[];
  },
) {
  const where = type.location ? `\n\nWhere: ${type.location}` : '';
  const said = booking.notes ? `\n\nNotes: ${booking.notes}` : '';
  const booked = `${type.durationMinutes}-minute ${type.title} with ${type.hostName} is booked for ${when(booking.startAt, booking.timezone)} (${booking.timezone}).${where}`;
  const guestNote = booking.guests.length > 0 ? `\n\nGuests: ${booking.guests.join(', ')}` : '';
  const sends = [
    mailer.sendCustomEmail({
      name: booking.name,
      email: booking.email,
      subject: `Booked: ${type.title} with ${type.hostName}`,
      message: `Your ${booked}`,
    }),
    ...booking.guests.map((guest) =>
      mailer.sendCustomEmail({
        name: guest,
        email: guest,
        subject: `Invited: ${type.title} with ${type.hostName}`,
        message: `${booking.name} invited you. The ${booked}`,
      }),
    ),
    mailer.sendCustomEmail({
      name: type.hostName,
      email: type.hostEmail,
      subject: `New booking: ${type.title} with ${booking.name}`,
      message: `${booking.name} (${booking.email}) booked ${type.title} for ${when(booking.startAt, type.timezone)} (${type.timezone}).${said}${guestNote}`,
    }),
  ];
  Promise.all(sends).catch((error: unknown) =>
    logger.warn({ err: error }, 'Meeting confirmation email failed'),
  );
}

/**
 * Books a free start for the person: checked against the live availability, held by a unique
 * index so two people can never take the same start, filed under their CRM contact (found by
 * email or created) as a Meeting activity, and confirmed to both sides by email.
 */
export async function bookMeeting(org: string, slug: string, input: BookMeetingInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name === '' || name.length > 120 || !isEmailAddress(email)) {
    badRequest('Enter your name and a valid email address.');
  }
  const timezone = input.timezone && isValidTimezone(input.timezone) ? input.timezone : 'UTC';
  const notes = (input.notes ?? '').trim().slice(0, 2000);
  const guests = [
    ...new Set((input.guests ?? []).map((g) => g.trim().toLowerCase()).filter(Boolean)),
  ];
  if (guests.length > MAX_GUESTS || guests.some((guest) => !isEmailAddress(guest))) {
    badRequest(`Add up to ${MAX_GUESTS} guests, each with a valid email address.`);
  }
  const { type, organizationId } = await publicType(org, slug);
  const startAt = new Date(input.startAt);
  const endAt = new Date(startAt.getTime() + type.durationMinutes * 60_000);
  return runForOrganization(organizationId, async () => {
    const busy = await busyFor(type, startAt, endAt);
    const free = freeSlots(type, startAt, endAt, busy).some(
      (slot) => slot.getTime() === startAt.getTime(),
    );
    if (!free) {
      badRequest('That time is no longer free. Pick another.');
    }
    const contact = await contactFor(name, email, type.hostName);
    try {
      await MeetingBookingModel.create({
        meetingTypeId: String(type._id),
        meetingTitle: type.title,
        hostUserId: type.hostUserId,
        hostName: type.hostName,
        startAt,
        endAt,
        name,
        email,
        notes,
        timezone,
        guests,
        contactId: contact.id,
      });
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        badRequest('That time was just taken. Pick another.');
      }
      throw error;
    }
    await ActivityModel.create({
      type: 'MEETING',
      subject: `${type.title} with ${name}`,
      notes: [
        notes || 'Booked from the public booking link',
        guests.length > 0 ? `Guests: ${guests.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      relatedType: 'CONTACT',
      relatedId: contact.id,
      relatedName: contact.name,
      dueDate: startAt,
      done: false,
      owner: type.hostName,
    });
    confirm(type, { startAt, name, email, notes, timezone, guests });
    return { title: type.title, hostName: type.hostName, startAt, endAt, location: type.location };
  });
}
