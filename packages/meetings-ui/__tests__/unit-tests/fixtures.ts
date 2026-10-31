import {
  MaActionStatus,
  MaCaptureState,
  MaDeliveryStatus,
  MaEmailStatus,
  MaLanguage,
  MaMeetingStatus,
  MaParticipantSource,
  MaParticipantStatus,
  MaPriority,
  MaReleaseChannel,
  MaReleaseStatus,
  MaStepStatus,
  MaSummaryStyle,
  MaTranscriptSource,
  MaTranscriptionState,
  type MaActionItemRowFragment,
  type MaEmailDeliveriesQuery,
  type MaMeetingDetailFragment,
  type MaNotesQuery,
  type MaParticipantRowFragment,
  type MaReleaseFieldsFragment,
  type MaSettingsFieldsFragment,
  type MaTranscriptQuery,
} from '@exyconn/shell/graphql/generated';
import type { NotesContent } from '../../src/notes/notes-sections';

export const STARTED = '2026-10-20T09:00:00.000Z';

export function makeMeeting(patch: Partial<MaMeetingDetailFragment> = {}): MaMeetingDetailFragment {
  return {
    id: 'meeting-1',
    meetingCode: 'abc-defg-hij',
    title: 'Weekly sync',
    ownerId: 'user-1',
    ownerName: 'Asha Rao',
    language: MaLanguage.English,
    startedAt: STARTED,
    endedAt: '2026-10-20T09:45:00.000Z',
    durationSeconds: 2700,
    status: MaMeetingStatus.Ended,
    participantCount: 4,
    transcriptionState: MaTranscriptionState.On,
    summaryStatus: MaStepStatus.Ready,
    emailStatus: MaEmailStatus.NotSent,
    actionItemCount: 3,
    openActionCount: 2,
    url: 'https://meet.google.com/abc-defg-hij',
    organizerName: 'Ravi Kumar',
    timezone: 'Asia/Kolkata',
    detectedLanguages: ['en', 'hi'],
    captureState: MaCaptureState.Stopped,
    consentRecordedAt: '2026-10-20T09:01:00.000Z',
    segmentCount: 120,
    officialImportStatus: MaStepStatus.NotStarted,
    summaryError: '',
    transcriptionFailures: 1,
    costUsd: 0.42,
    recordingSeconds: 2600,
    previousMeetingId: null,
    speakerMappings: [],
    ...patch,
  };
}

export function makeAction(patch: Partial<MaActionItemRowFragment> = {}): MaActionItemRowFragment {
  return {
    id: 'action-1',
    meetingId: 'meeting-1',
    meetingTitle: 'Weekly sync',
    title: 'Send the proposal',
    description: 'Include the revised pricing',
    assignedTo: 'Ravi',
    assignedUserId: 'user-2',
    dueDate: '2026-10-25T00:00:00.000Z',
    dueText: null,
    priority: MaPriority.High,
    status: MaActionStatus.Pending,
    sourceTimestampMs: 61_000,
    aiGenerated: true,
    needsConfirmation: false,
    overdue: false,
    completedAt: null,
    createdByName: 'Meeting Assistant',
    evidence: [
      {
        segmentId: 'seg-1',
        quote: 'Ravi will send it by Friday',
        startMs: 61_000,
        speakerLabel: 'Speaker 1',
      },
    ],
    comments: [],
    history: [],
    createdAt: STARTED,
    ...patch,
  };
}

export function makeContent(patch: Partial<NotesContent> = {}): NotesContent {
  return {
    overview: 'We reviewed the launch.',
    executiveSummary: 'Launch is on track.',
    agenda: ['Launch status'],
    discussionPoints: ['Pricing', 'Timeline'],
    risks: [],
    blockers: ['Legal review'],
    openQuestions: [],
    followUps: [],
    nextTopics: [],
    ...patch,
  };
}

type Notes = NonNullable<MaNotesQuery['maNotes']>;

export function makeNotes(patch: Partial<Notes> = {}): Notes {
  return {
    id: 'notes-1',
    version: 2,
    style: MaSummaryStyle.Detailed,
    model: 'gpt-test',
    generatedAt: STARTED,
    edited: false,
    original: makeContent({ overview: 'Original overview.' }),
    content: makeContent(),
    revisions: [
      { version: 1, byName: 'Meeting Assistant', at: STARTED },
      { version: 2, byName: 'Asha Rao', at: '2026-10-20T10:00:00.000Z' },
    ],
    costUsd: 0.12,
    ...patch,
  };
}

export type Segment = MaTranscriptQuery['maTranscript'][number];

export function makeSegment(patch: Partial<Segment> = {}): Segment {
  return {
    id: 'seg-1',
    source: MaTranscriptSource.Ai,
    startMs: 61_000,
    endMs: 64_000,
    text: 'Ravi will send it by Friday',
    speakerLabel: 'Unknown Speaker 1',
    speakerName: null,
    speakerConfirmed: false,
    ...patch,
  };
}

export function makeParticipant(
  patch: Partial<MaParticipantRowFragment> = {},
): MaParticipantRowFragment {
  return {
    id: 'p-1',
    meetingId: 'meeting-1',
    displayName: 'Ravi Kumar',
    email: 'ravi@example.com',
    status: MaParticipantStatus.Left,
    source: MaParticipantSource.GoogleMeetApi,
    confidence: 1,
    sessions: [{ joinedAt: STARTED, leftAt: '2026-10-20T09:40:00.000Z' }],
    rejoinCount: 0,
    totalSeconds: 2400,
    meetingTitle: 'Weekly sync',
    meetingStartedAt: STARTED,
    ...patch,
  };
}

export function makeRelease(patch: Partial<MaReleaseFieldsFragment> = {}): MaReleaseFieldsFragment {
  return {
    id: 'release-1',
    version: '1.4.0',
    channel: MaReleaseChannel.Stable,
    buildNumber: 42,
    commitSha: 'a1b2c3d4e5f6a7b8c9d0',
    builtAt: STARTED,
    artifactName: 'meeting-assistant-1.4.0.zip',
    artifactSize: 2048,
    sha256: 'f'.repeat(64),
    releaseNotes: 'Faster transcripts',
    minChromeVersion: '120',
    status: MaReleaseStatus.Published,
    storeItemId: '',
    storeUrl: '',
    buildRunUrl: 'https://github.com/example/actions/runs/1',
    publisherName: 'Asha Rao',
    downloadCount: 7,
    downloadable: true,
    statusHistory: [
      { status: MaReleaseStatus.QaPending, at: STARTED, byName: 'CI', note: 'Built' },
      {
        status: MaReleaseStatus.Published,
        at: '2026-10-21T09:00:00.000Z',
        byName: 'Asha Rao',
        note: 'Go',
      },
    ],
    ...patch,
  };
}

export type Delivery = MaEmailDeliveriesQuery['maEmailDeliveries'][number];

export function makeDelivery(patch: Partial<Delivery> = {}): Delivery {
  return {
    id: 'delivery-1',
    notesVersion: 2,
    recipient: 'ravi@example.com',
    status: MaDeliveryStatus.Sent,
    attempts: 1,
    error: '',
    sentAt: '2026-10-20T10:05:00.000Z',
    triggeredByName: 'Asha Rao',
    createdAt: '2026-10-20T10:04:00.000Z',
    ...patch,
  };
}

export function makeSettings(
  patch: Partial<MaSettingsFieldsFragment> = {},
): MaSettingsFieldsFragment {
  return {
    enabled: true,
    saveRecordings: true,
    audioRetentionDays: 90,
    allowedUserIds: [],
    remindersEnabled: true,
    reminderIntervalMinutes: 5,
    maxRemindersPerMeeting: 3,
    preferredLanguage: MaLanguage.Auto,
    summaryStyle: MaSummaryStyle.Detailed,
    transcriptRetentionDays: 365,
    autoGenerateSummary: true,
    autoEmail: false,
    emailRequiresApproval: true,
    defaultRecipients: ['team@example.com'],
    emailParticipants: true,
    emailAllowedDomains: ['example.com'],
    analysisModel: 'gpt-analysis',
    transcriptionModel: 'gpt-transcribe',
    diarization: true,
    monthlyBudgetUsd: 50,
    maxMeetingMinutes: 240,
    participantTracking: true,
    liveTranscript: false,
    releaseChannel: MaReleaseChannel.Stable,
    botEnabled: true,
    botAutoJoin: false,
    botName: 'Exyconn Notetaker',
    monthSpendUsd: 12.5,
    updatedByName: 'Asha Rao',
    updatedAt: '2026-10-19T08:00:00.000Z',
    ...patch,
  };
}

/** The employees every picker offers. */
export const EMPLOYEES = {
  listEmployeeOptions: [
    {
      id: 'user-1',
      name: 'Asha Rao',
      email: 'asha@example.com',
      designation: null,
      department: null,
    },
    {
      id: 'user-2',
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      designation: null,
      department: null,
    },
  ],
};
