import { PassThrough } from 'node:stream';
import { useTestOrganization } from '../../../helpers';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient, type TranscriptionResult } from '../../../../src/utils/openai';
import {
  AudioRejection,
  checkedChunk,
  transcribeChunk,
  type AudioChunk,
} from '../../../../src/modules/meeting-assistant/transcription.service';
import {
  MaChunkModel,
  MaEventModel,
  MaMeetingModel,
  MaSegmentModel,
} from '../../../../src/modules/meeting-assistant/models';
import {
  chunkBase64,
  recordingTracks,
  streamMergedWav,
} from '../../../../src/modules/meeting-assistant/recording.store';
import {
  WAV_HEADER_BYTES,
  readWav16k,
  wavHeader,
} from '../../../../src/modules/meeting-assistant/wav';
import {
  actorNamed,
  seedMeeting,
  seedOpenAiConfig,
  setMaSettings,
  wavOf,
  type LeanMeeting,
} from './ma.fixtures';

jest.mock('../../../../src/utils/openai', () => ({
  ...jest.requireActual('../../../../src/utils/openai'),
  openAiClient: { transcribe: jest.fn() },
}));

const transcribe = openAiClient.transcribe as jest.Mock;

/** One second of 16 kHz PCM16 audio. */
const ONE_SECOND = 32_000;

useTestOrganization();

const owner = actorNamed('Asha');

beforeAll(async () => {
  // The chunk receipt's unique index is what makes a repeated upload a no-op.
  await Promise.all([MaChunkModel.init(), MaSegmentModel.init(), MaMeetingModel.init()]);
});

const chunkFor = (meeting: LeanMeeting, overrides: Partial<AudioChunk> = {}): AudioChunk => ({
  meetingId: String(meeting._id),
  stream: 'TAB',
  seq: 0,
  startMs: 0,
  durationMs: 0,
  audio: wavOf(ONE_SECOND),
  ...overrides,
});

const result = (overrides: Partial<TranscriptionResult> = {}): TranscriptionResult => ({
  text: '',
  language: 'en',
  segments: [],
  promptTokens: 0,
  completionTokens: 0,
  ...overrides,
});

const liveMeeting = () => seedMeeting(owner, { consentRecordedAt: new Date() });

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AudioRejection) {
      return { status: error.status, code: error.code };
    }
    throw error;
  }
  throw new Error('Expected an AudioRejection');
};

describe('readWav16k', () => {
  it('accepts the canonical 16 kHz mono PCM16 file and measures it', () => {
    expect(readWav16k(wavOf(ONE_SECOND))).toEqual({ dataBytes: ONE_SECOND, durationMs: 1000 });
    expect(readWav16k(wavOf(16_000))).toEqual({ dataBytes: 16_000, durationMs: 500 });
    expect(readWav16k(wavOf(0))).toEqual({ dataBytes: 0, durationMs: 0 });
  });

  it('rejects stereo, 44.1 kHz and non-PCM files', () => {
    const stereo = wavOf(64);
    stereo.writeUInt16LE(2, 22);
    const cd = wavOf(64);
    cd.writeUInt32LE(44_100, 24);
    const float = wavOf(64);
    float.writeUInt16LE(3, 20);

    expect(readWav16k(stereo)).toBeNull();
    expect(readWav16k(cd)).toBeNull();
    expect(readWav16k(float)).toBeNull();
  });

  it('rejects a truncated header, an odd byte count and a data length that disagrees', () => {
    const odd = Buffer.concat([wavHeader(3), Buffer.alloc(3)]);
    const short = Buffer.concat([wavHeader(100), Buffer.alloc(50)]);

    expect(readWav16k(wavOf(64).subarray(0, WAV_HEADER_BYTES - 1))).toBeNull();
    expect(readWav16k(odd)).toBeNull();
    expect(readWav16k(short)).toBeNull();
    expect(readWav16k(Buffer.from('not a wav file at all, just some text here....'))).toBeNull();
  });

  it('takes the duration from the file, not from what the client claimed', () => {
    const chunk = checkedChunk({
      meetingId: 'm',
      stream: 'MIC',
      seq: 0,
      startMs: 0,
      durationMs: 999_999,
      audio: wavOf(ONE_SECOND * 2),
    });

    expect(chunk.durationMs).toBe(2000);
  });
});

describe('refusing audio', () => {
  beforeEach(async () => {
    await seedOpenAiConfig();
  });

  it('answers 415 for anything that is not the expected WAV', async () => {
    const meeting = await liveMeeting();

    await expect(
      rejection(transcribeChunk(meeting, owner, chunkFor(meeting, { audio: Buffer.from('x') }))),
    ).resolves.toEqual({ status: 415, code: 'unsupported_audio' });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it('answers 409 without consent, for an ended call and past the length cap', async () => {
    const noConsent = await seedMeeting(owner);
    const ended = await seedMeeting(owner, {
      meetingCode: 'xyz-wxyz-xyz',
      status: 'ENDED',
      consentRecordedAt: new Date(),
    });
    const live = await seedMeeting(owner, {
      meetingCode: 'klm-nopq-rst',
      consentRecordedAt: new Date(),
    });

    await expect(
      rejection(transcribeChunk(noConsent, owner, chunkFor(noConsent))),
    ).resolves.toEqual({ status: 409, code: 'consent_required' });
    await expect(rejection(transcribeChunk(ended, owner, chunkFor(ended)))).resolves.toEqual({
      status: 409,
      code: 'meeting_ended',
    });
    // The default cap is 240 minutes: a chunk ending one second past it is refused.
    await expect(
      rejection(transcribeChunk(live, owner, chunkFor(live, { startMs: 240 * 60_000 }))),
    ).resolves.toEqual({ status: 409, code: 'too_long' });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it('accepts a chunk that ends exactly at the length cap', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(result({ text: 'last words' }));

    const done = await transcribeChunk(
      meeting,
      owner,
      chunkFor(meeting, { startMs: 240 * 60_000 - 1000 }),
    );

    expect(done.status).toBe('DONE');
  });

  it('answers 403 once the monthly budget is spent', async () => {
    await setMaSettings({ monthlyBudgetUsd: 1 });
    await seedMeeting(owner, { meetingCode: 'spe-ntsp-ent', costUsd: 1.5, startedAt: new Date() });
    const meeting = await liveMeeting();

    await expect(rejection(transcribeChunk(meeting, owner, chunkFor(meeting)))).resolves.toEqual({
      status: 403,
      code: 'budget_exceeded',
    });
  });
});

describe('transcribing a chunk', () => {
  beforeEach(async () => {
    await seedOpenAiConfig();
  });

  it('labels the microphone stream as the signed-in user, never by guess', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(result({ text: 'I will send the deck' }));

    const done = await transcribeChunk(
      meeting,
      owner,
      chunkFor(meeting, { stream: 'MIC', startMs: 5000 }),
    );

    expect(done.status).toBe('DONE');
    expect(done.segments).toEqual([
      expect.objectContaining({
        text: 'I will send the deck',
        speakerLabel: 'Asha (microphone)',
        startMs: 5000,
        endMs: 6000,
      }),
    ]);
    const stored = await MaMeetingModel.findById(meeting._id).lean();
    expect(stored?.segmentCount).toBe(1);
    expect(stored?.audioSeconds).toBe(1);
    expect(stored?.detectedLanguages).toEqual(['en']);
  });

  it('keeps diarization labels as "Speaker X" on the meeting clock', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(
      result({
        text: 'hello there',
        segments: [
          { speaker: 'A', startMs: 0, endMs: 400, text: 'hello' },
          { speaker: null, startMs: 500, endMs: 300, text: 'there' },
        ],
      }),
    );

    const done = await transcribeChunk(meeting, owner, chunkFor(meeting, { startMs: 10_000 }));

    expect(done.segments.map((s) => [s.speakerLabel, s.startMs, s.endMs])).toEqual([
      ['Speaker A', 10_000, 10_400],
      [null, 10_500, 10_500],
    ]);
  });

  it('saves nothing for silence but still finishes the chunk', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(result({ text: '', language: null }));

    const done = await transcribeChunk(meeting, owner, chunkFor(meeting));

    expect(done).toEqual({ status: 'DONE', segments: [] });
    expect((await MaChunkModel.findOne({ meetingId: String(meeting._id) }).lean())?.status).toBe(
      'DONE',
    );
  });

  it('answers a repeated upload with the same lines and calls OpenAI once', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(result({ text: 'only once' }));

    const first = await transcribeChunk(meeting, owner, chunkFor(meeting));
    const second = await transcribeChunk(meeting, owner, chunkFor(meeting));

    expect(second.status).toBe('DUPLICATE');
    expect(second.segments).toEqual(first.segments);
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(await MaSegmentModel.countDocuments({ meetingId: String(meeting._id) })).toBe(1);
  });

  it('asks for the diarize model and the language the meeting is set to', async () => {
    await setMaSettings({ diarization: true });
    const meeting = await seedMeeting(owner, {
      consentRecordedAt: new Date(),
      language: 'ENGLISH',
    });
    transcribe.mockResolvedValue(result({ text: 'hi' }));

    await transcribeChunk(meeting, owner, chunkFor(meeting));

    expect(transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-transcribe-diarize',
        language: 'en',
        prompt: undefined,
        mimeType: 'audio/wav',
      }),
    );
  });

  it('hints mixed Hindi-English when the language is left on auto', async () => {
    const meeting = await liveMeeting();
    transcribe.mockResolvedValue(result({ text: 'haan theek hai' }));

    await transcribeChunk(meeting, owner, chunkFor(meeting));

    const request = transcribe.mock.calls[0][0] as {
      model: string;
      language?: string;
      prompt?: string;
    };
    expect(request.model).toBe('gpt-4o-transcribe');
    expect(request.language).toBeUndefined();
    expect(request.prompt).toContain('Hinglish');
  });

  it('marks a failed chunk, logs it, and lets the same chunk be retried', async () => {
    const meeting = await liveMeeting();
    transcribe.mockRejectedValueOnce(new Error('socket hang up'));

    await expect(rejection(transcribeChunk(meeting, owner, chunkFor(meeting)))).resolves.toEqual({
      status: 502,
      code: 'transcription_failed',
    });
    const chunk = await MaChunkModel.findOne({ meetingId: String(meeting._id) }).lean();
    expect(chunk?.status).toBe('FAILED');
    expect(chunk?.error).toBe('socket hang up');
    expect((await MaMeetingModel.findById(meeting._id).lean())?.transcriptionFailures).toBe(1);
    const event = await MaEventModel.findOne({ type: 'CHUNK_FAILED' }).lean();
    expect(event?.level).toBe('ERROR');
    expect(event?.viewerIds).toContain(owner.id);

    transcribe.mockResolvedValueOnce(result({ text: 'second time lucky' }));
    const retried = await transcribeChunk(meeting, owner, chunkFor(meeting));

    expect(retried.status).toBe('DONE');
    expect(retried.segments[0].text).toBe('second time lucky');
  });

  it('answers 503 when no OpenAI credential is configured', async () => {
    const meeting = await liveMeeting();
    await runAsPlatform(() => OpenAiConfigModel.deleteMany({}));

    await expect(rejection(transcribeChunk(meeting, owner, chunkFor(meeting)))).resolves.toEqual({
      status: 503,
      code: 'not_configured',
    });
  });
});

/** Everything a stream writes, once it ends. */
function collect(stream: PassThrough): Promise<Buffer> {
  const parts: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (part: Buffer) => parts.push(part));
    stream.on('end', () => resolve(Buffer.concat(parts)));
    stream.on('error', reject);
  });
}

describe('saved recordings', () => {
  beforeEach(async () => {
    await seedOpenAiConfig();
    transcribe.mockResolvedValue(result({ text: 'words' }));
  });

  it('keeps each chunk and merges a stream into one valid WAV', async () => {
    const meeting = await liveMeeting();
    const first = wavOf(ONE_SECOND, 1);
    const second = wavOf(ONE_SECOND / 2, 2);
    await transcribeChunk(meeting, owner, chunkFor(meeting, { seq: 0, audio: first }));
    await transcribeChunk(
      meeting,
      owner,
      chunkFor(meeting, { seq: 1, startMs: 1000, audio: second }),
    );
    const meetingId = String(meeting._id);

    expect(await recordingTracks(meetingId)).toEqual([
      { stream: 'TAB', chunkCount: 2, seconds: 2, sizeBytes: first.length + second.length },
    ]);
    expect(await chunkBase64({ meetingId, stream: 'TAB', seq: 1 })).toBe(second.toString('base64'));
    expect(await chunkBase64({ meetingId, stream: 'TAB', seq: 7 })).toBeNull();

    const out = new PassThrough();
    const merged = collect(out);
    expect(await streamMergedWav(meetingId, 'TAB', out)).toBe(true);
    const wav = await merged;

    expect(readWav16k(wav)).toEqual({ dataBytes: ONE_SECOND * 1.5, durationMs: 1500 });
    expect(wav.subarray(WAV_HEADER_BYTES)).toEqual(
      Buffer.concat([first.subarray(WAV_HEADER_BYTES), second.subarray(WAV_HEADER_BYTES)]),
    );
    expect((await MaMeetingModel.findById(meeting._id).lean())?.recordingSeconds).toBe(1.5);
  });

  it('reports nothing to merge for a stream with no audio', async () => {
    const meeting = await liveMeeting();

    expect(await streamMergedWav(String(meeting._id), 'MIC', new PassThrough())).toBe(false);
  });

  it('stores no audio when the company does not save recordings', async () => {
    await setMaSettings({ saveRecordings: false });
    const meeting = await liveMeeting();

    await transcribeChunk(meeting, owner, chunkFor(meeting));

    expect(await recordingTracks(String(meeting._id))).toEqual([]);
    expect((await MaMeetingModel.findById(meeting._id).lean())?.recordingSeconds).toBe(0);
  });
});
