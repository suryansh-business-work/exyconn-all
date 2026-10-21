import {
  renderStoredTemplate,
  sendTemplateEmail,
} from '../../../../src/modules/email/email.service';
import type { RawHtml } from '../../../../src/modules/email/email.render';
import {
  htmlList,
  previewSummary,
  retryDelivery,
  sendSummary,
  summaryRecipients,
  SUMMARY_TEMPLATE,
} from '../../../../src/modules/meeting-assistant/ma.email';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaDeliveryModel,
  MaMeetingModel,
  MaNotesModel,
  MaParticipantModel,
} from '../../../../src/modules/meeting-assistant/models';
import { actorNamed, seedMeeting, setMaSettings, type LeanMeeting } from './ma.fixtures';

jest.mock('../../../../src/modules/email/email.service', () => ({
  sendTemplateEmail: jest.fn(),
  renderStoredTemplate: jest.fn(),
}));

const send = sendTemplateEmail as jest.Mock;
const render = renderStoredTemplate as jest.Mock;

const owner = actorNamed('Asha', 'Asha@Exyconn.com');
const STARTED = new Date('2026-10-20T09:00:00Z');

const endedMeeting = () =>
  seedMeeting(owner, {
    status: 'ENDED',
    startedAt: STARTED,
    endedAt: new Date(STARTED.getTime() + 65 * 60_000),
  });

const content = (overrides: Record<string, unknown> = {}) => ({
  overview: 'Overview',
  executiveSummary: 'We shipped',
  discussionPoints: ['Roadmap <2027>'],
  ...overrides,
});

const writeNotes = (meeting: LeanMeeting, version = 1) =>
  MaNotesModel.updateOne(
    { meetingId: String(meeting._id) },
    {
      $set: { version, content: content(), original: content() },
      $setOnInsert: { style: 'DETAILED', model: 'gpt-4o', generatedAt: new Date() },
    },
    { upsert: true },
  );

const matched = (meeting: LeanMeeting, email: string, userId: string | null) =>
  MaParticipantModel.create({
    meetingId: String(meeting._id),
    key: `ui:${email}`,
    displayName: email.split('@')[0],
    email,
    userId,
    source: 'MEET_UI',
  });

const recipientsOf = () => send.mock.calls.map((call) => (call[0] as { to: string }).to).sort();
const statusOf = async (meeting: LeanMeeting) =>
  (await MaMeetingModel.findById(meeting._id).lean())?.emailStatus;

beforeAll(async () => {
  await MaDeliveryModel.init();
});

beforeEach(() => {
  send.mockResolvedValue(undefined);
});

describe('htmlList', () => {
  it('escapes every item and says so when there is none', () => {
    expect(htmlList(['<script>x</script>', 'a & b'])).toBe(
      '<ul><li>&lt;script&gt;x&lt;/script&gt;</li><li>a &amp; b</li></ul>',
    );
    expect(htmlList([])).toBe('<br />None recorded.');
  });
});

describe('summaryRecipients', () => {
  it('is the owner and the default recipients, deduplicated, without participants by default', async () => {
    await setMaSettings({ defaultRecipients: ['ops@exyconn.com', 'asha@exyconn.com'] });
    const meeting = await endedMeeting();
    await matched(meeting, 'ravi@exyconn.com', 'user-2');

    expect(await summaryRecipients(meeting)).toEqual(['asha@exyconn.com', 'ops@exyconn.com']);
  });

  it('adds only participants matched to a portal account when switched on', async () => {
    await setMaSettings({ emailParticipants: true });
    const meeting = await endedMeeting();
    await matched(meeting, 'Ravi@Exyconn.com', 'user-2');
    await matched(meeting, 'guest@gmail.com', null);

    expect(await summaryRecipients(meeting)).toEqual(['asha@exyconn.com', 'ravi@exyconn.com']);
  });
});

describe('sendSummary', () => {
  it('refuses to send notes that do not exist yet', async () => {
    const meeting = await endedMeeting();

    await expect(sendSummary(meeting, 'Asha')).rejects.toThrow('These notes are not ready yet.');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends each recipient the saved notes exactly once per version', async () => {
    await setMaSettings({ defaultRecipients: ['ops@exyconn.com'] });
    const meeting = await endedMeeting();
    const meetingId = String(meeting._id);
    await writeNotes(meeting);
    await MaDecisionModel.create({ meetingId, fingerprint: 'f', text: 'Ship <now>' });
    await MaActionItemModel.create([
      {
        meetingId,
        title: 'Send deck',
        assignedTo: 'Asha',
        dueDate: new Date('2026-10-23T00:00:00Z'),
        needsConfirmation: true,
        createdById: 's',
      },
      { meetingId, title: 'Book room', dueText: 'tomorrow', createdById: 's' },
      { meetingId, title: 'Dropped', status: 'CANCELLED', createdById: 's' },
    ]);

    expect(await sendSummary(meeting, 'Asha')).toBe(0);
    expect(await sendSummary(meeting, 'Asha')).toBe(0);

    expect(recipientsOf()).toEqual(['asha@exyconn.com', 'ops@exyconn.com']);
    const { template, variables } = send.mock.calls[0][0] as {
      template: string;
      variables: Record<string, string | RawHtml>;
    };
    expect(template).toBe(SUMMARY_TEMPLATE);
    expect(variables).toMatchObject({
      meetingTitle: 'Weekly sync',
      duration: '1 h 5 min',
      executiveSummary: 'We shipped',
    });
    expect((variables.decisions as RawHtml).html).toContain('Ship &lt;now&gt;');
    const actions = (variables.actionItems as RawHtml).html;
    expect(actions).toContain('Send deck — Asha, 2026-10-23 (to confirm)');
    expect(actions).toContain('Book room — Owner not specified, tomorrow');
    expect(actions).not.toContain('Dropped');
    expect(await statusOf(meeting)).toBe('SENT');
  });

  it('sends a new version of the notes again', async () => {
    const meeting = await endedMeeting();
    await writeNotes(meeting, 1);
    await sendSummary(meeting, 'Asha');
    await writeNotes(meeting, 2);

    await sendSummary(meeting, 'Asha');

    expect(send).toHaveBeenCalledTimes(2);
    expect(await MaDeliveryModel.countDocuments()).toBe(2);
  });

  it('records a failed send, reports the status, and retries it on request', async () => {
    await setMaSettings({ defaultRecipients: ['ops@exyconn.com'] });
    const meeting = await endedMeeting();
    await writeNotes(meeting);
    send.mockImplementation(async ({ to }: { to: string }) => {
      if (to === 'ops@exyconn.com') {
        throw new Error('Mailbox full');
      }
    });

    expect(await sendSummary(meeting, 'Asha')).toBe(1);
    const failed = await MaDeliveryModel.findOne({ recipient: 'ops@exyconn.com' }).lean();
    expect(failed).toMatchObject({ status: 'FAILED', error: 'Mailbox full', attempts: 1 });
    expect(await statusOf(meeting)).toBe('PARTIAL');

    send.mockResolvedValue(undefined);
    const retried = await retryDelivery(meeting, String(failed?._id));

    expect(retried).toMatchObject({ status: 'SENT', attempts: 1, error: '' });
    expect(await statusOf(meeting)).toBe('SENT');
  });

  it('marks the email FAILED when nobody could be reached, and stops after the attempt limit', async () => {
    const meeting = await endedMeeting();
    await writeNotes(meeting);
    send.mockRejectedValue('not an error');

    expect(await sendSummary(meeting, 'Asha')).toBe(1);
    expect(await statusOf(meeting)).toBe('FAILED');
    expect((await MaDeliveryModel.findOne().lean())?.error).toBe('Send failed');

    await sendSummary(meeting, 'Asha');
    await sendSummary(meeting, 'Asha');
    expect(await sendSummary(meeting, 'Asha')).toBe(0);
    expect(send).toHaveBeenCalledTimes(3);
  });
});

describe('previewSummary', () => {
  it('renders the stored template with the saved notes and names the recipients', async () => {
    const meeting = await endedMeeting();
    await writeNotes(meeting);
    render.mockResolvedValue({ subject: 'Notes: Weekly sync', html: '<p>notes</p>' });

    const preview = await previewSummary(meeting);

    expect(preview).toEqual({
      subject: 'Notes: Weekly sync',
      html: '<p>notes</p>',
      recipients: ['asha@exyconn.com'],
    });
    expect(render).toHaveBeenCalledWith(
      SUMMARY_TEMPLATE,
      expect.objectContaining({ duration: '1 h 5 min' }),
    );
  });
});
