import { Types } from 'mongoose';
import { MeetingTypeModel } from '../../../../../src/modules/crm/meetings/meeting.models';
import {
  meetingTypes,
  type MeetingTypeInput,
} from '../../../../../src/modules/crm/meetings/meeting.types.service';
import { runForOrganization } from '../../../../../src/lib/tenant';
import { codeOf } from '../../codeOf';

const host = { id: 'u1', name: 'Asha', email: 'Asha@Acme.test' };

const input: MeetingTypeInput = {
  title: '  Intro call ',
  slug: ' Intro-Call ',
  durationMinutes: 30,
  timezone: 'Asia/Kolkata',
  weeklyHours: [
    { day: 1, enabled: true, start: '09:00', end: '17:00' },
    { day: 2, enabled: false, start: 'xx', end: '' },
  ],
  bufferMinutes: 10,
  minNoticeHours: 4,
  maxDaysAhead: 30,
  active: true,
};

const hours = (start: string, end: string) => [{ day: 1, enabled: true, start, end }];

beforeAll(async () => {
  await MeetingTypeModel.init();
});

describe('meetingTypes.create', () => {
  it('saves a tidied meeting type hosted by the caller', async () => {
    const created = await meetingTypes.create(input, host);

    expect(created).toMatchObject({
      title: 'Intro call',
      slug: 'intro-call',
      description: '',
      location: '',
      hostUserId: 'u1',
      hostName: 'Asha',
      hostEmail: 'asha@acme.test',
      bufferMinutes: 10,
    });
    expect(created.weeklyHours).toHaveLength(2);
  });

  it('keeps a description and a location when given', async () => {
    const created = await meetingTypes.create(
      { ...input, description: 'Say hello', location: 'https://meet.google.com/x' },
      host,
    );

    expect(created).toMatchObject({
      description: 'Say hello',
      location: 'https://meet.google.com/x',
    });
  });

  it.each([
    ['a link that is not a slug', { slug: 'x' }, 'for the link.'],
    ['an unknown time zone', { timezone: 'Mars/Olympus' }, 'Pick a time zone from the list.'],
    [
      'a weekday twice',
      { weeklyHours: [...hours('09:00', '10:00'), ...hours('11:00', '12:00')] },
      'Each weekday can appear once.',
    ],
    [
      'a weekday below Sunday',
      { weeklyHours: [{ day: -1, enabled: true, start: '09:00', end: '10:00' }] },
      'Each weekday can appear once.',
    ],
    [
      'a weekday above Saturday',
      { weeklyHours: [{ day: 7, enabled: true, start: '09:00', end: '10:00' }] },
      'Each weekday can appear once.',
    ],
    [
      'a start after the end',
      { weeklyHours: hours('17:00', '09:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'a start equal to the end',
      { weeklyHours: hours('09:00', '09:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'a start that is not a clock',
      { weeklyHours: hours('9:00', '10:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'an end that is not a clock',
      { weeklyHours: hours('09:00', 'ab:cd') },
      'Each available day needs a start before its end.',
    ],
    [
      'an hour past 23',
      { weeklyHours: hours('09:00', '24:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'a negative hour',
      { weeklyHours: hours('-1:00', '10:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'a negative minute',
      { weeklyHours: hours('09:-1', '10:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'a minute past 59',
      { weeklyHours: hours('09:60', '10:00') },
      'Each available day needs a start before its end.',
    ],
    [
      'no available day',
      { weeklyHours: [{ day: 1, enabled: false, start: '09:00', end: '17:00' }] },
      'Make at least one day available.',
    ],
  ])('refuses %s', async (_label, change, message) => {
    await expect(meetingTypes.create({ ...input, ...change }, host)).rejects.toThrow(message);
    await expect(MeetingTypeModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a link another company already uses', async () => {
    const otherCompany = new Types.ObjectId().toHexString();
    await runForOrganization(otherCompany, () =>
      MeetingTypeModel.create({
        ...input,
        slug: 'intro-call',
        hostUserId: 'u9',
        hostName: 'Zed',
        hostEmail: 'z@o.test',
      }),
    );

    await expect(meetingTypes.create(input, host)).rejects.toThrow(
      'That link is taken. Choose another.',
    );
  });
});

describe('meetingTypes.update', () => {
  it('saves the changes and keeps its own link', async () => {
    const created = await meetingTypes.create(input, host);

    const updated = await meetingTypes.update(created._id.toHexString(), {
      ...input,
      title: 'Discovery',
    });

    expect(updated).toMatchObject({ title: 'Discovery', slug: 'intro-call', hostName: 'Asha' });
  });

  it('refuses a link another meeting type has', async () => {
    await meetingTypes.create({ ...input, slug: 'taken' }, host);
    const created = await meetingTypes.create(input, host);

    await expect(
      meetingTypes.update(created._id.toHexString(), { ...input, slug: 'taken' }),
    ).rejects.toThrow('That link is taken.');
  });

  it('says so when the meeting type is gone', async () => {
    await expect(
      codeOf(meetingTypes.update(new Types.ObjectId().toHexString(), input)),
    ).resolves.toBe('NOT_FOUND');
  });
});

describe('meetingTypes.list and remove', () => {
  it('lists newest first and removes one', async () => {
    const first = await meetingTypes.create({ ...input, slug: 'first' }, host);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await meetingTypes.create({ ...input, slug: 'second' }, host);

    const listed = await meetingTypes.list();
    expect(listed.map((row) => row.slug)).toEqual(['second', 'first']);

    await expect(meetingTypes.remove(first._id.toHexString())).resolves.toBe(true);
    await expect(MeetingTypeModel.countDocuments()).resolves.toBe(1);
    await expect(codeOf(meetingTypes.remove(first._id.toHexString()))).resolves.toBe('NOT_FOUND');
  });
});
