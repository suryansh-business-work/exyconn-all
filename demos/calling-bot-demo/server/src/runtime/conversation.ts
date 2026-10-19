import type { CallingBotCallRecord, CallingBotConfigRecord, TurnRole } from '../index';
import { playMs } from './audio';
import { streamReply, type ChatMessage } from './llm';
import { errorText, log } from './log';
import { SpeechToText } from './sarvam/speech-to-text';
import { TextToSpeech } from './sarvam/text-to-speech';
import { SentenceBuffer } from './sentences';
import { addTurn, endCall, setStatus } from './store';
import type { Transport } from './transport';

/** Said to the model on every call, after the operator's own prompt: this is a live voice call. */
const VOICE_RULES =
  'You are speaking on a live voice call. Answer in one or two short spoken sentences, in the language the caller uses. Never use markdown, lists, emoji or URLs.';

/**
 * One call with the bot, over any transport: the caller's audio goes to speech-to-text; each
 * finished utterance goes to OpenAI; the reply is spoken sentence by sentence as it streams.
 * The caller can talk over the bot at any time: its voice is cut and its reply abandoned.
 */
export class Conversation {
  private readonly history: ChatMessage[];
  private readonly listener: SpeechToText;
  private readonly voice: TextToSpeech;
  private readonly limit: NodeJS.Timeout;
  private reply: AbortController | null = null;
  /** When the bot's queued voice will have finished playing. */
  private speakingUntil = 0;
  private ended = false;

  private constructor(
    private readonly call: CallingBotCallRecord,
    private readonly config: CallingBotConfigRecord,
    private readonly transport: Transport,
  ) {
    this.history = [{ role: 'system', content: `${config.systemPrompt}\n\n${VOICE_RULES}` }];
    this.listener = new SpeechToText(config.sarvamApiKey, config.languageCode, transport.format, {
      onSpeechStart: () => this.interrupt(),
      onUtterance: (text) => this.heard(text),
      onFailure: (reason) => this.end('FAILED', reason),
    });
    this.voice = new TextToSpeech(
      config.sarvamApiKey,
      { model: config.ttsModel, speaker: config.ttsSpeaker, languageCode: config.languageCode },
      transport.format,
      {
        onAudio: (audio) => this.play(audio),
        onFailure: (reason) => this.end('FAILED', reason),
      },
    );
    this.limit = setTimeout(
      () => this.end('ENDED', 'Time limit reached'),
      config.maxCallSeconds * 1000,
    );
  }

  /** Answers a call: marks it live and greets the caller. */
  static open(
    call: CallingBotCallRecord,
    config: CallingBotConfigRecord,
    transport: Transport,
  ): Conversation {
    const conversation = new Conversation(call, config, transport);
    conversation.start();
    return conversation;
  }

  private start(): void {
    setStatus(this.call, 'LIVE', { answeredAt: new Date() }).catch((error) =>
      log.error('could not mark the call live', { callId: this.id, error: errorText(error) }),
    );
    this.say(this.config.greeting);
  }

  private get id(): string {
    return String(this.call._id);
  }

  /** A chunk of the caller's audio, base64, in the transport's format. */
  hear(audio: string): void {
    if (!this.ended) {
      this.listener.hear(audio);
    }
  }

  /** Ends the call once; later calls do nothing. */
  end(status: 'ENDED' | 'FAILED', reason: string): void {
    if (this.ended) {
      return;
    }
    this.ended = true;
    clearTimeout(this.limit);
    this.reply?.abort();
    this.listener.close();
    this.voice.close();
    log.info('call ended', { callId: this.id, status, reason });
    endCall(this.call, status, reason).catch((error) =>
      log.error('could not record the end of a call', { callId: this.id, error: errorText(error) }),
    );
    this.transport.notify({ type: 'ended', reason, failed: status === 'FAILED' });
    this.transport.hangUp();
  }

  private record(role: TurnRole, text: string): void {
    this.transport.notify({ type: 'turn', role, text });
    addTurn(this.call, role, text).catch((error) =>
      log.error('could not save a turn', { callId: this.id, error: errorText(error) }),
    );
  }

  private say(text: string): void {
    this.history.push({ role: 'assistant', content: text });
    this.record('BOT', text);
    this.voice.speak(text);
  }

  private play(audio: string): void {
    const now = Date.now();
    this.speakingUntil = Math.max(now, this.speakingUntil) + playMs(audio, this.transport.format);
    this.transport.play(audio);
  }

  /** The caller started talking: if the bot is speaking or about to, it stops. */
  private interrupt(): void {
    const speaking = Date.now() < this.speakingUntil;
    if (!speaking && !this.reply) {
      return;
    }
    this.reply?.abort();
    this.reply = null;
    this.voice.stop();
    this.transport.clear();
    this.speakingUntil = 0;
  }

  private heard(text: string): void {
    if (this.ended) {
      return;
    }
    this.history.push({ role: 'user', content: text });
    this.record('CALLER', text);
    this.respond().catch((error) =>
      log.error('could not answer', { callId: this.id, error: errorText(error) }),
    );
  }

  private async respond(): Promise<void> {
    this.reply?.abort();
    const controller = new AbortController();
    this.reply = controller;
    const sentences = new SentenceBuffer();
    let spoken = '';
    const speak = (sentence: string) => {
      spoken = `${spoken} ${sentence}`.trim();
      this.voice.speak(sentence);
    };
    try {
      const reply = await streamReply({
        apiKey: this.config.openAiApiKey,
        model: this.config.openAiModel,
        messages: this.history,
        signal: controller.signal,
        onText: (text) => sentences.push(text).forEach(speak),
      });
      const rest = sentences.rest();
      if (rest) {
        speak(rest);
      }
      this.history.push({ role: 'assistant', content: reply });
      this.record('BOT', reply);
    } catch (error) {
      if (!controller.signal.aborted) {
        throw error;
      }
      // Cut off: the model is told only what the caller actually heard.
      if (spoken) {
        this.history.push({ role: 'assistant', content: `${spoken}…` });
        this.record('BOT', `${spoken}…`);
      }
    } finally {
      if (this.reply === controller) {
        this.reply = null;
      }
    }
  }
}
