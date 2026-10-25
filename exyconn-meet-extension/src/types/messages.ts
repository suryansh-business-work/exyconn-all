import type { LogBatch } from '@exyconn/logger';
import type {
  MaActionItemsQuery,
  MaActionStatus,
  MaExtensionContextQuery,
  MaFollowUpQuery,
  MaNotesQuery,
  MaParticipantsQuery,
} from '../graphql/generated';
import type { ReminderAction } from '../utils/reminders';
import type {
  CaptureState,
  IconStatus,
  LiveSegment,
  MeetingState,
  RecordedAudio,
  RecordedVideo,
  SeenParticipant,
  TranscriptionState,
} from './meeting';

/** The company's switches for the extension, as the portal sent them. */
export type OrgContext = MaExtensionContextQuery['maExtensionContext'];

export interface AuthSnapshot {
  signedIn: boolean;
  org: OrgContext | null;
}

/** Everything a UI needs to draw one Meet tab. Holds no tokens and no transcript text. */
export interface TabSnapshot {
  tabId: number;
  meetingCode: string;
  meetingId: string | null;
  meetingState: MeetingState;
  transcriptionState: TranscriptionState;
  captureState: CaptureState;
  /** English source string, translated where it is shown. */
  captureError: string | null;
  consentRecorded: boolean;
  micEnabled: boolean;
  pendingUploads: number;
  participantCount: number;
  /** Another tab of the same call is already capturing; this one may not. */
  captureElsewhere: boolean;
  reminderBanner: boolean;
  iconStatus: IconStatus;
}

export interface WorkerState {
  auth: AuthSnapshot;
  tab: TabSnapshot | null;
}

/** What the in-Meet panel may ask for. The worker supplies the meeting id from the tab. */
export type PanelRequest =
  | { op: 'followUp' }
  | { op: 'transcript'; afterMs: number | null }
  | { op: 'liveSegments' }
  | { op: 'participants' }
  | { op: 'notes' }
  | { op: 'actions'; page: number }
  | { op: 'setActionStatus'; id: string; status: MaActionStatus };

export interface PanelResults {
  followUp: MaFollowUpQuery['maFollowUp'];
  transcript: LiveSegment[];
  liveSegments: LiveSegment[];
  participants: MaParticipantsQuery['maParticipants'];
  notes: MaNotesQuery;
  actions: MaActionItemsQuery['maActionItemsPaged'];
  setActionStatus: { id: string; status: MaActionStatus };
}

/** What the content script reports after each (debounced) look at the page. */
export interface MeetReport {
  meetingCode: string;
  url: string;
  title: string;
  meetingState: MeetingState;
  transcriptionState: TranscriptionState;
  participants: SeenParticipant[];
  participantsComplete: boolean;
}

/** Messages any extension context sends to the service worker. `tabId` defaults to the sender's tab. */
export type WorkerRequest =
  | { type: 'meet/hello'; page: { meetingCode: string; url: string; title: string } }
  | { type: 'meet/report'; report: MeetReport }
  | { type: 'meet/gone' }
  | { type: 'state/get'; tabId?: number }
  | { type: 'auth/sign-in'; email: string; password: string; remember: boolean }
  | { type: 'auth/mfa'; challenge: string; code: string; remember: boolean }
  | { type: 'auth/sign-out' }
  | { type: 'capture/consent'; tabId?: number }
  | { type: 'capture/pause'; tabId?: number }
  | { type: 'capture/resume'; tabId?: number }
  | { type: 'capture/stop'; tabId?: number }
  | { type: 'reminder/action'; tabId?: number; action: ReminderAction }
  | { type: 'panel/request'; tabId?: number; request: PanelRequest }
  | { type: 'log/batch'; batch: LogBatch }
  | { type: 'i18n/messages' }
  | { type: 'options/open' }
  | RecorderReport;

/** From the recorder in the Meet page to the worker. Accepted only from that tab itself. */
export type RecorderReport =
  /** May this tab start? Answers the CapturePlan the recorder follows. */
  | { type: 'recorder/prepare' }
  /** The tab is shared and every recorder runs. */
  | { type: 'recorder/started'; micEnabled: boolean }
  | { type: 'recorder/audio'; chunk: RecordedAudio }
  | { type: 'recorder/video'; piece: RecordedVideo }
  /** Everything is flushed and released; `reason` (an English source string) when it stopped on its own. */
  | { type: 'recorder/ended'; reason: string | null }
  /** Something to tell the user while recording goes on, e.g. the microphone is unavailable. */
  | { type: 'recorder/notice'; reason: string };

/** From the worker to the recorder in a Meet tab. */
export interface RecorderCommand {
  target: 'recorder';
  type: 'recorder/pause' | 'recorder/resume' | 'recorder/stop';
}

/** Pushed by the worker to a Meet tab and to an open popup whenever the tab's state changes. */
export interface StateBroadcast {
  type: 'state/changed';
  state: WorkerState;
}

/** Every reply has this shape, so a failure never arrives as a silent `undefined`. */
export type WorkerReply<T> = { ok: true; data: T } | { ok: false; error: string };
