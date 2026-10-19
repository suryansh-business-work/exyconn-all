import { OrganizationModel } from '../../../../../src/modules/organizations/organization.model';
import { BrandingModel } from '../../../../../src/modules/branding';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import {
  MeetingBookingModel,
  MeetingTypeModel,
} from '../../../../../src/modules/crm/meetings/meeting.models';
import { saveMeetingSettings } from '../../../../../src/modules/crm/meetings/meeting.settings';
import { MeetingVisitModel } from '../../../../../src/modules/crm/meetings/meeting.visits';
import {
  bookMeeting,
  publicBookingPage,
  publicMeeting,
  publicSlots,
  trackMeetingView,
  type BookMeetingInput,
} from '../../../../../src/modules/crm/meetings/meeting.booking.service';
import { runAsPlatform, runForOrganization } from '../../../../../src/lib/tenant';
import { mailer } from '../../../../../src/utils/mailer';
import { logger } from '../../../../../src/utils/logger';
import { freezeClock } from '../../../../helpers';
import { codeOf } from '../../codeOf';

jest.mock('../../../../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const at = { org: ' ACME ', page: ' Meeting ' };
const MONDAY_9 = new Date('2026-10-19T09:00:00.000Z');
const MONDAY_10 = new Date('2026-10-19T10:00:00.000Z');

let companyId = '';
const inCompany = <T>(fn: () => Promise<T>) => runForOrganization(companyId, fn);

/** An hour-long meeting, Mondays 09:00-12:00 UTC, hosted by u1. */
const meetingType = (fields: Record<string, unknown> = {}) =>
  inCompany(() =>
    MeetingTypeModel.create({
      title: 'Intro call',
      slug: 'intro',
      description: 'Say hello',
      durationMinutes: 60,
      hostUserId: 'u1',
      hostName: 'Asha',
      hostEmail: 'asha@acme.test',
      timezone: 'UTC',
      weeklyHours: [{ day: 1, enabled: true, start: '09:00', end: '12:00' }],
      minNoticeHours: 0,
      ...fields,
    }),
  );

const booker: BookMeetingInput = { startAt: MONDAY_9, name: ' Bo ', email: ' Bo@Client.test ' };

const send = jest.mocked(mailer.sendCustomEmail);

beforeAll(async () => {
  await MeetingBookingModel.init();
});

beforeEach(async () => {
  freezeClock('2026-10-18T00:00:00.000Z');
  const company = await runAsPlatform(() =>
    OrganizationModel.create({ name: 'Acme', slug: 'acme', currency: 'USD' }),
  );
  companyId = company._id.toHexString();
  send.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the public booking page', () => {
  it('lists the active meetings, oldest first, with no logo when none is set', async () => {
    await meetingType();
    await meetingType({ slug: 'demo', title: 'Demo', location: 'Office 4' });
    await meetingType({ slug: 'old', title: 'Old', active: false });

    const page = await publicBookingPage(at);

    expect(page).toMatchObject({
      organizationName: 'Acme',
      organizationSlug: 'acme',
      logoUrl: '',
      logoDarkUrl: '',
    });
    expect(page.meetings.map(({ slug, hasLocation }) => ({ slug, hasLocation }))).toEqual([
      { slug: 'intro', hasLocation: false },
      { slug: 'demo', hasLocation: true },
    ]);
    expect(page.meetings[0]).not.toHaveProperty('location');
    expect(page.meetings[0]).not.toHaveProperty('hostEmail');
  });

  it('carries the company logos', async () => {
    await inCompany(() =>
      BrandingModel.create({
        key: 'global',
        logoUrl: 'https://img/l.png',
        logoDarkUrl: 'https://img/d.png',
      }),
    );

    await expect(publicBookingPage(at)).resolves.toMatchObject({
      logoUrl: 'https://img/l.png',
      logoDarkUrl: 'https://img/d.png',
      meetings: [],
    });
  });

  it('is not found for an unknown company or a page address the company has not chosen', async () => {
    await expect(codeOf(publicBookingPage({ org: 'nobody', page: 'meeting' }))).resolves.toBe(
      'NOT_FOUND',
    );
    await expect(codeOf(publicBookingPage({ org: 'acme', page: 'book' }))).resolves.toBe(
      'NOT_FOUND',
    );
  });

  it('stops answering at the old address once the company picks a new one', async () => {
    await inCompany(() => saveMeetingSettings({ bookingSlug: 'talk' }));

    await expect(codeOf(publicBookingPage(at))).resolves.toBe('NOT_FOUND');
    await expect(publicBookingPage({ org: 'acme', page: 'talk' })).resolves.toMatchObject({
      organizationSlug: 'acme',
    });
  });
});

describe('publicMeeting', () => {
  it('shows one active meeting without its location', async () => {
    await meetingType({ location: 'Office 4' });

    await expect(publicMeeting(at, ' INTRO ')).resolves.toEqual({
      slug: 'intro',
      title: 'Intro call',
      description: 'Say hello',
      durationMinutes: 60,
      hostName: 'Asha',
      timezone: 'UTC',
      hasLocation: true,
      organizationName: 'Acme',
      organizationSlug: 'acme',
      logoUrl: '',
      logoDarkUrl: '',
    });
  });

  it('is not found for an unknown or switched-off meeting', async () => {
    await meetingType({ active: false });

    await expect(codeOf(publicMeeting(at, 'intro'))).resolves.toBe('NOT_FOUND');
    await expect(codeOf(publicMeeting(at, 'missing'))).resolves.toBe('NOT_FOUND');
  });
});

describe('trackMeetingView', () => {
  it('counts a view in the company with the visitor zone country', async () => {
    await expect(trackMeetingView(at, ' Intro ', 'Europe/Berlin')).resolves.toBe(true);

    const rows = await inCompany(() => MeetingVisitModel.find().lean());
    expect(rows.map(({ kind, meetingSlug, country }) => ({ kind, meetingSlug, country }))).toEqual([
      { kind: 'VIEW', meetingSlug: 'intro', country: 'DE' },
    ]);
  });
});

describe('publicSlots', () => {
  const until = new Date('2026-10-20T00:00:00.000Z');
  const from = new Date('2026-10-19T00:00:00.000Z');

  it('refuses an empty, backwards or too-long period', async () => {
    await expect(publicSlots(at, 'intro', from, from)).rejects.toThrow(
      'Ask for at most 62 days at a time.',
    );
    await expect(publicSlots(at, 'intro', until, from)).rejects.toThrow('at most 62 days');
    await expect(
      publicSlots(at, 'intro', from, new Date(from.getTime() + 63 * 24 * 60 * 60 * 1000)),
    ).rejects.toThrow('at most 62 days');
  });

  it("leaves out the host's confirmed meetings of any type, but not cancelled ones", async () => {
    await meetingType();
    const base = {
      meetingTitle: 'Other',
      hostUserId: 'u1',
      hostName: 'Asha',
      name: 'Cy',
      email: 'cy@client.test',
    };
    await inCompany(() =>
      MeetingBookingModel.create([
        {
          ...base,
          meetingTypeId: 'other',
          startAt: MONDAY_10,
          endAt: new Date('2026-10-19T11:00:00.000Z'),
        },
        {
          ...base,
          meetingTypeId: 'other',
          startAt: new Date('2026-10-19T11:00:00.000Z'),
          endAt: new Date('2026-10-19T12:00:00.000Z'),
          status: 'CANCELLED',
        },
        { ...base, hostUserId: 'u2', meetingTypeId: 'x', startAt: MONDAY_9, endAt: MONDAY_10 },
      ]),
    );

    const slots = await publicSlots(at, 'intro', from, until);

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-19T09:00:00.000Z',
      '2026-10-19T11:00:00.000Z',
    ]);
  });
});

describe('bookMeeting', () => {
  it('books a free start, files it on a new contact, counts it and confirms it', async () => {
    const type = await meetingType({ location: 'Office 4' });
    await inCompany(() =>
      saveMeetingSettings({ bookingSlug: 'meeting', zoomUrl: 'https://zoom.us/j/1' }),
    );

    const result = await bookMeeting(at, 'intro', {
      ...booker,
      notes: '  About pricing ',
      timezone: 'Asia/Kolkata',
    });

    expect(result).toEqual({
      title: 'Intro call',
      hostName: 'Asha',
      startAt: MONDAY_9,
      endAt: MONDAY_10,
      location: 'Office 4',
      joinLinks: ['Zoom: https://zoom.us/j/1'],
    });
    const [booking] = await inCompany(() => MeetingBookingModel.find().lean());
    const [contact] = await inCompany(() => ContactModel.find().lean());
    expect(booking).toMatchObject({
      meetingTypeId: type._id.toHexString(),
      name: 'Bo',
      email: 'bo@client.test',
      notes: 'About pricing',
      timezone: 'Asia/Kolkata',
      country: 'IN',
      status: 'CONFIRMED',
      contactId: contact._id.toHexString(),
    });
    expect(contact).toMatchObject({
      name: 'Bo',
      email: 'bo@client.test',
      leadSource: 'Meeting booking',
    });
    const activities = await inCompany(() => ActivityModel.find().lean());
    expect(activities).toEqual([
      expect.objectContaining({
        type: 'MEETING',
        subject: 'Intro call with Bo',
        notes: 'About pricing',
        owner: 'Asha',
        relatedId: contact._id.toHexString(),
      }),
    ]);
    await new Promise((resolve) => setImmediate(resolve));
    const visits = await inCompany(() => MeetingVisitModel.find().lean());
    expect(
      visits.map(({ kind, meetingSlug, country }) => ({ kind, meetingSlug, country })),
    ).toEqual([{ kind: 'BOOKED', meetingSlug: 'intro', country: 'IN' }]);
    expect(send.mock.calls.map(([payload]) => payload.email)).toEqual([
      'bo@client.test',
      'asha@acme.test',
    ]);
  });

  it('reads an unknown or missing zone as UTC and notes the public link when nothing was said', async () => {
    await meetingType();

    await bookMeeting(at, 'intro', { ...booker, timezone: 'Mars/Olympus', notes: null });

    const [booking] = await inCompany(() => MeetingBookingModel.find().lean());
    const [activity] = await inCompany(() => ActivityModel.find().lean());
    expect(booking).toMatchObject({ timezone: 'UTC', country: '', guests: [] });
    expect(activity.notes).toBe('Booked from the public booking link');
  });

  it('invites tidied guests and files the meeting on each guest who is already a contact', async () => {
    await meetingType();
    const cy = await inCompany(() => ContactModel.create({ name: 'Cy', email: 'cy@client.test' }));

    await bookMeeting(at, 'intro', {
      ...booker,
      timezone: null,
      guests: [' CY@client.test ', 'cy@client.test', 'bo@client.test', 'new@client.test', ' '],
    });

    const [booking] = await inCompany(() => MeetingBookingModel.find().lean());
    expect(booking.guests).toEqual(['cy@client.test', 'bo@client.test', 'new@client.test']);
    const activities = await inCompany(() => ActivityModel.find().sort({ subject: 1 }).lean());
    expect(
      activities.map(({ subject, relatedId, notes }) => ({ subject, relatedId, notes })),
    ).toEqual([
      {
        subject: 'Intro call with Bo',
        relatedId: booking.contactId,
        notes:
          'Booked from the public booking link\nGuests: cy@client.test, bo@client.test, new@client.test',
      },
      {
        subject: 'Intro call with Bo (guest)',
        relatedId: cy._id.toHexString(),
        notes:
          'Booked from the public booking link\nGuests: cy@client.test, bo@client.test, new@client.test',
      },
    ]);
    await expect(inCompany(() => ContactModel.countDocuments())).resolves.toBe(2);
  });

  it.each([
    ['no name', { name: '  ' }, 'Enter your name and a valid email address.'],
    [
      'a name over 120 characters',
      { name: 'x'.repeat(121) },
      'Enter your name and a valid email address.',
    ],
    ['an invalid email', { email: 'bo@' }, 'Enter your name and a valid email address.'],
    [
      'more than ten guests',
      { guests: Array.from({ length: 11 }, (_v, index) => `g${index}@client.test`) },
      'Add up to 10 guests, each with a valid email address.',
    ],
    ['a guest with an invalid email', { guests: ['nope'] }, 'Add up to 10 guests'],
  ])('refuses %s before writing anything', async (_label, change, message) => {
    await meetingType();

    await expect(bookMeeting(at, 'intro', { ...booker, ...change })).rejects.toThrow(message);
    await expect(inCompany(() => ContactModel.countDocuments())).resolves.toBe(0);
  });

  it('refuses a start that is outside the hours or already booked', async () => {
    await meetingType();

    await expect(
      bookMeeting(at, 'intro', { ...booker, startAt: new Date('2026-10-19T09:30:00.000Z') }),
    ).rejects.toThrow('That time is no longer free. Pick another.');
    await bookMeeting(at, 'intro', booker);
    await expect(bookMeeting(at, 'intro', { ...booker, email: 'cy@client.test' })).rejects.toThrow(
      'That time is no longer free.',
    );
    await expect(inCompany(() => MeetingBookingModel.countDocuments())).resolves.toBe(1);
  });

  it('says the time was just taken when another booking holds the same start', async () => {
    const type = await meetingType();
    // Held under a host the availability check does not look at, as after the host changed.
    await inCompany(() =>
      MeetingBookingModel.create({
        meetingTypeId: type._id.toHexString(),
        meetingTitle: 'Intro call',
        hostUserId: 'previous-host',
        hostName: 'Zed',
        startAt: MONDAY_9,
        endAt: MONDAY_10,
        name: 'Cy',
        email: 'cy@client.test',
      }),
    );

    await expect(codeOf(bookMeeting(at, 'intro', booker))).resolves.toBe('BAD_USER_INPUT');
    await expect(bookMeeting(at, 'intro', booker)).rejects.toThrow(
      'That time was just taken. Pick another.',
    );
  });

  it('passes any other failure to hold the start through unchanged', async () => {
    await meetingType();
    const failure = new Error('disk full');
    jest.spyOn(MeetingBookingModel, 'create').mockRejectedValueOnce(failure);

    await expect(bookMeeting(at, 'intro', booker)).rejects.toBe(failure);
  });

  it('still books when counting the booking fails, and logs it', async () => {
    await meetingType();
    const failure = new Error('visits down');
    jest.spyOn(MeetingVisitModel, 'create').mockRejectedValueOnce(failure);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    await expect(bookMeeting(at, 'intro', booker)).resolves.toMatchObject({ startAt: MONDAY_9 });
    await new Promise((resolve) => setImmediate(resolve));

    expect(warn).toHaveBeenCalledWith({ err: failure }, 'Meeting booking was not counted');
    await expect(inCompany(() => MeetingBookingModel.countDocuments())).resolves.toBe(1);
  });
});
