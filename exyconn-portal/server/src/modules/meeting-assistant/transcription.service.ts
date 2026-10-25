import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient, withOpenAiRetry, type TranscriptionResult } from '../../utils/openai';
import { costOfRun } from '../ai/ai.pricing';
import { runAsPlatform } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { MaChunkModel, MaMeetingModel, MaSegmentModel, type MaMeetingDocument } from './models';
import { getMaSettings, withinMonthlyBudget } from './settings.service';
import { saveChunk } from './recording.store';
import { logMaEvent } from './events.service';
import { readWav16k } from './wav';
import type { MaActor } from './ma.access';
import type { MaLanguage } from './ma.enums';

/** A refusal the audio endpoint answers with its own status and a machine-readable code. */
export class AudioRejection extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryAfterMs = 0,
  ) {
    super(code);
    this.name = 'AudioRejection';
  }
}

export type AudioStream = 'TAB' | 'MIC';
/** WAV from older extension builds; self-contained WebM/Opus files from newer ones. */
export type AudioMimeType = 'audio/wav' | 'audio/webm';

export interface AudioChunk {
  meetingId: string;
  stream: AudioStream;
  seq: number;
  startMs: number;
  durationMs: number;
  mimeType: AudioMimeType;
  /** A 16 kHz mono PCM16 WAV file or a self-contained WebM file (decoded from base64). */
  audio: Buffer;
}

export interface ChunkSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speakerLabel: string | null;
  language: string | null;
}

/** Transcriptions running at once in this process: back-pressure for one shared API key. */
const MAX_CONCURRENT = 4;
let running = 0;
const TRANSCRIBE_TIMEOUT_MS = 90_000;
const BUSY_RETRY_MS = 3_000;
/**
 * Hint for mixed-language calls: Hindi written in Roman letters, the way Hinglish is typed in
 * chat. Whisper-family models copy the prompt's script and style, hence the example sentence.
 * Never asks the model to translate.
 */
export const HINGLISH_PROMPT =
  'The speakers mix Hindi and English (Hinglish). Write every Hindi word in Roman (Latin) ' +
  'letters, never in Devanagari, the way Hinglish is typed in chat, for example: ' +
  '"Haan, main kal tak deck bhej dunga, phir hum Monday ko review kar lenge." ' +
  'Transcribe exactly what is said. Never translate.';
const DIARIZE_MODEL = 'gpt-4o-transcribe-diarize';
/** A WebM file starts with the EBML magic number. */
const EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const MAX_WEBM_CHUNK_MS = 60_000;

const DUPLICATE_KEY = 11000;

const LANGUAGE_CODES: Partial<Record<MaLanguage, string>> = { ENGLISH: 'en', HINDI: 'hi' };

type LeanMeeting = MaMeetingDocument & { _id: unknown };

interface Acceptance {
  model: string;
  saveRecording: boolean;
}

/**
 * The diarize model ignores prompts, so it is used only where speaker labels add something
 * and no romanization hint is needed: the meeting tab, unless the call is set to Hinglish.
 * The microphone is one known speaker.
 */
function modelFor(
  settings: { diarization: boolean; transcriptionModel: string },
  meeting: LeanMeeting,
  stream: AudioStream,
): string {
  const diarize = settings.diarization && stream === 'TAB' && meeting.language !== 'HINGLISH';
  return diarize ? DIARIZE_MODEL : settings.transcriptionModel;
}

/** The meeting may take audio: live, consented, under the length and budget caps. */
async function assertAccepts(meeting: LeanMeeting, chunk: AudioChunk): Promise<Acceptance> {
  if (meeting.status !== 'ACTIVE') {
    throw new AudioRejection(409, 'meeting_ended');
  }
  if (!meeting.consentRecordedAt) {
    throw new AudioRejection(409, 'consent_required');
  }
  const settings = await getMaSettings();
  if (chunk.startMs + chunk.durationMs > settings.maxMeetingMinutes * 60_000) {
    throw new AudioRejection(409, 'too_long');
  }
  if (!(await withinMonthlyBudget(settings))) {
    throw new AudioRejection(403, 'budget_exceeded');
  }
  return {
    model: modelFor(settings, meeting, chunk.stream),
    // WebM audio is kept by the screen recording instead; the WAV store holds only WAV.
    saveRecording: settings.saveRecordings && chunk.mimeType === 'audio/wav',
  };
}

/**
 * Claims a chunk for transcription. A finished chunk answers with what it already produced;
 * one in flight asks the client to wait; a failed one is claimed again.
 */
async function claimChunk(chunk: AudioChunk): Promise<'CLAIMED' | 'DONE'> {
  const filter = { meetingId: chunk.meetingId, stream: chunk.stream, seq: chunk.seq };
  try {
    await MaChunkModel.create({ ...filter, durationMs: chunk.durationMs });
    return 'CLAIMED';
  } catch (error) {
    if ((error as { code?: number }).code !== DUPLICATE_KEY) {
      throw error;
    }
    const existing = await MaChunkModel.findOne(filter).lean();
    if (existing?.status === 'DONE') {
      return 'DONE';
    }
    const reclaimed = await MaChunkModel.updateOne(
      { ...filter, status: 'FAILED' },
      { $set: { status: 'RUNNING', error: '' } },
    );
    if (reclaimed.modifiedCount === 1) {
      return 'CLAIMED';
    }
    throw new AudioRejection(429, 'busy', BUSY_RETRY_MS);
  }
}

/** Who spoke, as far as the evidence goes: never a name the audio cannot prove. */
function speakerFor(stream: AudioStream, actor: MaActor, diarized: string | null): string | null {
  if (stream === 'MIC') {
    // The microphone stream is the signed-in user's own voice, by construction.
    return `${actor.name} (microphone)`;
  }
  return diarized ? `Speaker ${diarized}` : null;
}

/** The transcription's lines as segments on the meeting's own clock. */
export function toSegments(chunk: AudioChunk, actor: MaActor, result: TranscriptionResult) {
  const base = {
    meetingId: chunk.meetingId,
    source: 'AI',
    stream: chunk.stream,
    chunkSeq: chunk.seq,
  };
  if (result.segments.length > 0) {
    return result.segments.map((segment, index) => ({
      ...base,
      index,
      startMs: chunk.startMs + segment.startMs,
      endMs: chunk.startMs + Math.max(segment.endMs, segment.startMs),
      text: segment.text,
      language: result.language,
      speakerLabel: speakerFor(chunk.stream, actor, segment.speaker),
    }));
  }
  if (result.text === '') {
    return [];
  }
  return [
    {
      ...base,
      index: 0,
      startMs: chunk.startMs,
      endMs: chunk.startMs + chunk.durationMs,
      text: result.text,
      language: result.language,
      speakerLabel: speakerFor(chunk.stream, actor, null),
    },
  ];
}

async function callOpenAi(meeting: LeanMeeting, chunk: AudioChunk, model: string) {
  const config = await runAsPlatform(() => OpenAiConfigModel.findOne({ isActive: true }).lean());
  if (!config) {
    throw new AudioRejection(503, 'not_configured');
  }
  const language = LANGUAGE_CODES[meeting.language as MaLanguage];
  return withOpenAiRetry(
    () =>
      openAiClient.transcribe({
        apiKey: config.apiKey,
        model,
        audio: chunk.audio,
        mimeType: chunk.mimeType,
        language,
        prompt: language ? undefined : HINGLISH_PROMPT,
        signal: AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS),
      }),
    { attempts: 2, baseDelayMs: 1_500 },
  );
}

async function saveResult(
  meeting: LeanMeeting,
  chunk: AudioChunk,
  actor: MaActor,
  model: string,
  result: TranscriptionResult,
): Promise<ChunkSegment[]> {
  const rows = toSegments(chunk, actor, result);
  const saved = rows.length > 0 ? await MaSegmentModel.insertMany(rows, { ordered: false }) : [];
  const costUsd = await costOfRun(model, result);
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    {
      $inc: { segmentCount: saved.length, audioSeconds: chunk.durationMs / 1000, costUsd },
      ...(result.language ? { $addToSet: { detectedLanguages: result.language } } : {}),
    },
  );
  await MaChunkModel.updateOne(
    { meetingId: chunk.meetingId, stream: chunk.stream, seq: chunk.seq },
    { $set: { status: 'DONE' } },
  );
  return saved.map((row) => ({
    id: row._id.toHexString(),
    startMs: row.startMs,
    endMs: row.endMs,
    text: row.text,
    speakerLabel: row.speakerLabel ?? null,
    language: row.language ?? null,
  }));
}

/** What an already-finished chunk produced, for a retried upload. */
async function existingSegments(chunk: AudioChunk): Promise<ChunkSegment[]> {
  const rows = await MaSegmentModel.find({
    meetingId: chunk.meetingId,
    source: 'AI',
    stream: chunk.stream,
    chunkSeq: chunk.seq,
  })
    .sort({ index: 1 })
    .lean();
  return rows.map((row) => ({
    id: String(row._id),
    startMs: row.startMs,
    endMs: row.endMs,
    text: row.text,
    speakerLabel: row.speakerLabel ?? null,
    language: row.language ?? null,
  }));
}

async function markFailed(meeting: LeanMeeting, chunk: AudioChunk, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message.slice(0, 300) : 'Transcription failed';
  await MaChunkModel.updateOne(
    { meetingId: chunk.meetingId, stream: chunk.stream, seq: chunk.seq },
    { $set: { status: 'FAILED', error: message } },
  );
  await MaMeetingModel.updateOne({ _id: meeting._id }, { $inc: { transcriptionFailures: 1 } });
  logger.warn({ meetingId: chunk.meetingId, seq: chunk.seq, err: message }, 'Meeting chunk failed');
}

/** A WebM chunk starts with the EBML magic and claims a believable length. */
function checkedWebm(chunk: AudioChunk): AudioChunk {
  if (!chunk.audio.subarray(0, EBML_MAGIC.length).equals(EBML_MAGIC)) {
    throw new AudioRejection(415, 'unsupported_audio');
  }
  if (chunk.durationMs < 1 || chunk.durationMs > MAX_WEBM_CHUNK_MS) {
    throw new AudioRejection(400, 'invalid_duration');
  }
  return chunk;
}

/**
 * A WAV chunk is a 16 kHz mono PCM16 WAV, whose own length is the one that counts; a WebM
 * chunk is checked by its magic and keeps the length the client measured.
 */
export function checkedChunk(chunk: AudioChunk): AudioChunk {
  if (chunk.mimeType === 'audio/webm') {
    return checkedWebm(chunk);
  }
  const wav = readWav16k(chunk.audio);
  if (!wav) {
    throw new AudioRejection(415, 'unsupported_audio');
  }
  return { ...chunk, durationMs: wav.durationMs };
}

/** Keeps a WAV chunk's audio when the company saves recordings. */
async function keepAudio(meeting: LeanMeeting, chunk: AudioChunk): Promise<void> {
  await saveChunk(
    { meetingId: chunk.meetingId, stream: chunk.stream, seq: chunk.seq },
    chunk.audio,
    chunk.durationMs,
  );
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    { $inc: { recordingSeconds: chunk.durationMs / 1000 } },
  );
}

/**
 * Transcribes one uploaded chunk exactly once, and saves its audio when recordings are kept.
 * A retried upload of a finished chunk answers with what it already produced.
 */
export async function transcribeChunk(
  meeting: LeanMeeting,
  actor: MaActor,
  raw: AudioChunk,
): Promise<{ status: 'DONE' | 'DUPLICATE'; segments: ChunkSegment[] }> {
  const chunk = checkedChunk(raw);
  const accepted = await assertAccepts(meeting, chunk);
  if ((await claimChunk(chunk)) === 'DONE') {
    return { status: 'DUPLICATE', segments: await existingSegments(chunk) };
  }
  if (running >= MAX_CONCURRENT) {
    await MaChunkModel.deleteOne({
      meetingId: chunk.meetingId,
      stream: chunk.stream,
      seq: chunk.seq,
    });
    throw new AudioRejection(429, 'busy', BUSY_RETRY_MS);
  }
  running += 1;
  const details = { stream: chunk.stream, seq: chunk.seq, durationMs: chunk.durationMs };
  try {
    if (accepted.saveRecording) {
      await keepAudio(meeting, chunk);
    }
    const result = await callOpenAi(meeting, chunk, accepted.model);
    const segments = await saveResult(meeting, chunk, actor, accepted.model, result);
    await logMaEvent({
      type: 'CHUNK_TRANSCRIBED',
      message: `Transcribed ${chunk.stream === 'MIC' ? 'microphone' : 'meeting'} audio chunk ${chunk.seq + 1}`,
      meeting,
      actor,
      details: {
        ...details,
        lines: segments.length,
        saved: accepted.saveRecording,
        language: result.language,
      },
    });
    return { status: 'DONE', segments };
  } catch (error) {
    await markFailed(meeting, chunk, error);
    const code = error instanceof AudioRejection ? error.code : 'transcription_failed';
    await logMaEvent({
      type: 'CHUNK_FAILED',
      level: 'ERROR',
      message: `Audio chunk ${chunk.seq + 1} could not be transcribed (${code})`,
      meeting,
      actor,
      details: { ...details, code },
    });
    if (error instanceof AudioRejection) {
      throw error;
    }
    throw new AudioRejection(502, 'transcription_failed', BUSY_RETRY_MS);
  } finally {
    running -= 1;
  }
}
