import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient, withOpenAiRetry } from '../../utils/openai';
import { costOfRun } from '../ai/ai.pricing';
import { runAsPlatform } from '../../lib/tenant';
import { MaParticipantModel, MaSegmentModel, type MaMeetingDocument } from './models';
import {
  analysisSchema,
  mergePrompt,
  parseAnalysis,
  systemPrompt,
  userPrompt,
  type Analysis,
  type PromptContext,
  type PromptLine,
} from './analysis.prompt';
import type { MaSummaryStyle } from './ma.enums';
import { speakerNameFor } from './speakers';

/** Characters of transcript per request: well inside GPT-4o's context with room to answer. */
export const WINDOW_CHARS = 48_000;
const CALL_TIMEOUT_MS = 120_000;

type LeanMeeting = MaMeetingDocument & { _id: unknown };

/** A transcript line with the stored segment it came from, so evidence can point back to it. */
export interface SourceLine extends PromptLine {
  segmentId: string;
  speakerLabel: string | null;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
}

/** What one analysis produced, with every line number resolved back to its segment. */
export interface AnalysisRun {
  analysis: Analysis;
  lines: SourceLine[];
  model: string;
  usage: Usage;
  costUsd: number;
}

/**
 * The transcript the notes are written from: Google Meet's official one when it was imported,
 * otherwise the AI transcription. Never both, which would double every line.
 */
export async function transcriptLines(meeting: LeanMeeting): Promise<SourceLine[]> {
  const meetingId = String(meeting._id);
  const official = await MaSegmentModel.exists({ meetingId, source: 'GOOGLE_MEET' });
  const segments = await MaSegmentModel.find({ meetingId, source: official ? 'GOOGLE_MEET' : 'AI' })
    .sort({ startMs: 1, stream: 1, index: 1 })
    .lean();
  return segments.map((segment, n) => ({
    n,
    startMs: segment.startMs,
    speaker: speakerNameFor(meeting, segment.speakerLabel ?? null),
    text: segment.text,
    segmentId: String(segment._id),
    speakerLabel: segment.speakerLabel ?? null,
  }));
}

/** Consecutive windows of at most WINDOW_CHARS each, never splitting a line. */
export function windows(lines: SourceLine[], limit = WINDOW_CHARS): SourceLine[][] {
  const result: SourceLine[][] = [];
  let current: SourceLine[] = [];
  let size = 0;
  for (const line of lines) {
    const length = line.text.length + line.speaker.length + 16;
    if (current.length > 0 && size + length > limit) {
      result.push(current);
      current = [];
      size = 0;
    }
    current.push(line);
    size += length;
  }
  if (current.length > 0) {
    result.push(current);
  }
  return result;
}

interface Caller {
  apiKey: string;
  model: string;
  system: string;
  usage: Usage;
}

/** One request, once more with a reminder when the reply is not the JSON asked for. */
/** One request; its tokens count towards the run whether or not the reply parses. */
async function askOnce(caller: Caller, prompt: string): Promise<Analysis | null> {
  const reply = await withOpenAiRetry(() =>
    openAiClient.complete({
      apiKey: caller.apiKey,
      model: caller.model,
      system: caller.system,
      prompt,
      json: true,
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    }),
  );
  caller.usage.promptTokens += reply.promptTokens;
  caller.usage.completionTokens += reply.completionTokens;
  return parseAnalysis(reply.text);
}

/** One request, once more with a reminder when the reply is not the JSON asked for. */
async function ask(caller: Caller, prompt: string): Promise<Analysis> {
  const first = await askOnce(caller, prompt);
  if (first) {
    return first;
  }
  const second = await askOnce(caller, `${prompt}\n\nReply with the JSON object only.`);
  if (second) {
    return second;
  }
  throw new Error('The AI did not return valid meeting notes.');
}

/** Folds per-window analyses: sections merged by the model, items concatenated. */
async function combine(caller: Caller, parts: Analysis[]): Promise<Analysis> {
  if (parts.length === 1) {
    return parts[0];
  }
  const sections = parts.map((part) => ({ ...part, decisions: [], actionItems: [] }));
  const merged = await ask(caller, mergePrompt(sections));
  return {
    ...merged,
    decisions: parts.flatMap((part) => part.decisions),
    actionItems: parts.flatMap((part) => part.actionItems),
  };
}

async function participantNames(meetingId: string): Promise<string[]> {
  const rows = await MaParticipantModel.find({ meetingId }).select('displayName').lean();
  return [...new Set(rows.map((row) => row.displayName))];
}

/**
 * Runs GPT-4o over the meeting's transcript. A long meeting is analysed in windows whose line
 * numbers are global, so every cited line resolves to one stored segment.
 */
export async function analyseMeeting(
  meeting: LeanMeeting,
  style: MaSummaryStyle,
  model: string,
): Promise<AnalysisRun> {
  const lines = await transcriptLines(meeting);
  if (lines.length === 0) {
    throw new Error('There is no transcript to summarise.');
  }
  const config = await runAsPlatform(() => OpenAiConfigModel.findOne({ isActive: true }).lean());
  if (!config) {
    throw new Error('OpenAI is not configured (Tech > Environment Variables > OpenAI).');
  }
  const caller: Caller = {
    apiKey: config.apiKey,
    model,
    system: systemPrompt(style, meeting.language),
    usage: { promptTokens: 0, completionTokens: 0 },
  };
  const parts = windows(lines);
  const base: PromptContext = {
    title: meeting.title,
    date: new Date(meeting.startedAt).toISOString().slice(0, 10),
    timezone: meeting.timezone,
    participants: await participantNames(String(meeting._id)),
  };
  // The windows are independent: they are analysed side by side, then folded in order.
  const analyses = await Promise.all(
    parts.map((part, index) => {
      const context =
        parts.length > 1 ? { ...base, part: { index: index + 1, total: parts.length } } : base;
      return ask(caller, userPrompt(context, part));
    }),
  );
  const analysis = analysisSchema.parse(await combine(caller, analyses));
  return {
    analysis,
    lines,
    model,
    usage: caller.usage,
    costUsd: await costOfRun(model, caller.usage),
  };
}
