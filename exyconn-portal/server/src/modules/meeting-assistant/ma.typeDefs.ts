import gql from 'graphql-tag';

/** Meetings, transcripts, participants and the dashboard. */
export const maMeetingTypeDefs = gql`
  enum MaTranscriptionState {
    ON
    OFF
    UNKNOWN
    NOT_SUPPORTED
    PERMISSION_REQUIRED
  }

  enum MaCaptureState {
    IDLE
    RECORDING
    PAUSED
    STOPPED
    ERROR
  }

  enum MaMeetingStatus {
    ACTIVE
    ENDED
  }

  enum MaStepStatus {
    NOT_STARTED
    QUEUED
    RUNNING
    READY
    FAILED
    SKIPPED
  }

  enum MaEmailStatus {
    NOT_SENT
    AWAITING_APPROVAL
    QUEUED
    SENT
    PARTIAL
    FAILED
  }

  enum MaLanguage {
    AUTO
    ENGLISH
    HINDI
    HINGLISH
  }

  enum MaTranscriptSource {
    GOOGLE_MEET
    AI
  }

  enum MaParticipantStatus {
    JOINED
    LEFT
    UNKNOWN
  }

  enum MaParticipantSource {
    GOOGLE_MEET_API
    MEET_UI
    EXTENSION_USER
  }

  "Which meetings a list covers: the caller's own, or the whole company (AI role)."
  enum MaScope {
    MINE
    ALL
  }

  "A diarization label confirmed by a person to be somebody."
  type MaSpeakerMapping {
    label: String!
    name: String!
    userId: String
    confirmedByName: String!
    confirmedAt: DateTime!
  }

  "One Google Meet call, as one signed-in extension user attended it."
  type MaMeeting {
    id: ID!
    meetingCode: String!
    url: String!
    title: String!
    ownerId: String!
    ownerName: String!
    organizerName: String
    timezone: String!
    language: MaLanguage!
    detectedLanguages: [String!]!
    startedAt: DateTime!
    endedAt: DateTime
    "Seconds between start and end (or now, while the call is still on)."
    durationSeconds: Int!
    status: MaMeetingStatus!
    participantCount: Int!
    transcriptionState: MaTranscriptionState!
    captureState: MaCaptureState!
    consentRecordedAt: DateTime
    segmentCount: Int!
    "Seconds of saved recording (16 kHz PCM WAV) across both streams."
    recordingSeconds: Int!
    officialImportStatus: MaStepStatus!
    summaryStatus: MaStepStatus!
    summaryError: String!
    emailStatus: MaEmailStatus!
    transcriptionFailures: Int!
    costUsd: Float!
    actionItemCount: Int!
    openActionCount: Int!
    previousMeetingId: String
    speakerMappings: [MaSpeakerMapping!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MaMeetingPage {
    rows: [MaMeeting!]!
    totalCount: Int!
  }

  "One transcript line. speakerLabel is the original evidence; speakerName is set only once confirmed."
  type MaTranscriptSegment {
    id: ID!
    meetingId: String!
    source: MaTranscriptSource!
    stream: String!
    startMs: Int!
    endMs: Int!
    text: String!
    language: String
    speakerLabel: String
    speakerName: String
    speakerConfirmed: Boolean!
  }

  "A transcript line found by search, with the meeting it belongs to."
  type MaTranscriptHit {
    id: ID!
    meetingId: String!
    meetingTitle: String!
    meetingStartedAt: DateTime!
    startMs: Int!
    text: String!
    speakerLabel: String
    source: MaTranscriptSource!
  }

  type MaTranscriptHitPage {
    rows: [MaTranscriptHit!]!
    totalCount: Int!
  }

  type MaAttendance {
    joinedAt: DateTime!
    leftAt: DateTime
  }

  "Somebody who joined the call. email is only ever a verified address."
  type MaParticipant {
    id: ID!
    meetingId: String!
    displayName: String!
    email: String
    userId: String
    role: String
    status: MaParticipantStatus!
    source: MaParticipantSource!
    confidence: Float!
    sessions: [MaAttendance!]!
    rejoinCount: Int!
    totalSeconds: Int!
    meetingTitle: String!
    meetingStartedAt: DateTime!
  }

  type MaParticipantPage {
    rows: [MaParticipant!]!
    totalCount: Int!
  }

  input MaDashboardFilter {
    from: DateTime
    to: DateTime
    ownerId: String
    participantUserId: String
    status: MaMeetingStatus
    language: MaLanguage
    scope: MaScope
  }

  type MaCount {
    value: String!
    count: Int!
  }

  type MaDashboard {
    totalMeetings: Int!
    meetingsThisMonth: Int!
    totalDurationSeconds: Int!
    notesGenerated: Int!
    pendingActions: Int!
    completedActions: Int!
    overdueActions: Int!
    transcriptionFailures: Int!
    costUsd: Float!
    byLanguage: [MaCount!]!
    byDay: [MaCount!]!
  }

  input MaUpdateMeetingInput {
    title: String!
    language: MaLanguage!
  }

  input MaSpeakerInput {
    label: String!
    name: String!
    userId: String
  }

  "A Meet participant event, as the extension saw it in the visible call UI."
  input MaParticipantEventInput {
    key: String!
    displayName: String!
    event: MaParticipantStatus!
    at: DateTime!
    "True for the signed-in extension user, whose identity is verified."
    isSelf: Boolean!
  }

  input MaStartSessionInput {
    meetingCode: String!
    url: String!
    title: String!
    timezone: String!
    startedAt: DateTime!
  }

  input MaHeartbeatInput {
    transcriptionState: MaTranscriptionState!
    captureState: MaCaptureState!
    participantCount: Int!
    title: String
  }

  "One saved audio stream of a meeting: the meeting tab or the user's microphone."
  type MaRecordingTrack {
    stream: String!
    chunkCount: Int!
    seconds: Int!
    sizeBytes: Int!
  }

  enum MaEventLevel {
    INFO
    WARN
    ERROR
  }

  "One thing that happened in a meeting's life: sign-in, consent, capture, a chunk, an import, notes, email, an error."
  type MaEvent {
    id: ID!
    meetingId: String
    meetingTitle: String!
    actorId: String!
    actorName: String!
    type: String!
    level: MaEventLevel!
    message: String!
    "JSON string of extra context (ids, counts, error codes). Never audio, transcript text or tokens."
    details: String!
    createdAt: DateTime!
  }

  type MaEventPage {
    rows: [MaEvent!]!
    totalCount: Int!
  }

  extend type Query {
    maRecording(meetingId: ID!): [MaRecordingTrack!]!
    "One saved chunk as a base64 string of a 16 kHz mono 16-bit PCM WAV file."
    maRecordingChunkBase64(meetingId: ID!, stream: String!, seq: Int!): String!
    maEventsPaged(input: TableQueryInput!, scope: MaScope, meetingId: ID): MaEventPage!
    maDashboard(filter: MaDashboardFilter): MaDashboard!
    maMeetingsPaged(input: TableQueryInput!, scope: MaScope): MaMeetingPage!
    maMeeting(id: ID!): MaMeeting!
    "A slice of one meeting's transcript, in time order. limit is capped at 500."
    maTranscript(
      meetingId: ID!
      source: MaTranscriptSource
      afterMs: Int
      limit: Int
    ): [MaTranscriptSegment!]!
    maTranscriptSearch(input: TableQueryInput!, scope: MaScope): MaTranscriptHitPage!
    maParticipants(meetingId: ID!): [MaParticipant!]!
    maParticipantsPaged(input: TableQueryInput!, scope: MaScope): MaParticipantPage!
  }

  extend type Mutation {
    maUpdateMeeting(id: ID!, input: MaUpdateMeetingInput!): MaMeeting!
    "Deletes the meeting and everything recorded for it: transcript, notes, actions, emails."
    maDeleteMeeting(id: ID!): Boolean!
    maConfirmSpeaker(meetingId: ID!, input: MaSpeakerInput!): MaMeeting!
    "Opens (or finds again, after a reload or reconnect) the caller's session for a call."
    maStartSession(input: MaStartSessionInput!): MaMeeting!
    "The owner confirms participants were told the call is being transcribed."
    maRecordConsent(meetingId: ID!): MaMeeting!
    maHeartbeat(meetingId: ID!, input: MaHeartbeatInput!): MaMeeting!
    maRecordParticipantEvents(meetingId: ID!, events: [MaParticipantEventInput!]!): Int!
    "Ends the call and queues the after-meeting pipeline (import, notes, email). Idempotent."
    maFinalizeSession(meetingId: ID!, endedAt: DateTime!): MaMeeting!
    "A link that downloads one stream of the recording as a single WAV file, valid for a few minutes."
    maRecordingDownloadLink(meetingId: ID!, stream: String!): MaDownloadLink!
  }
`;
