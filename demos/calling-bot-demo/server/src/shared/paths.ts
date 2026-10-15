/**
 * The voice server's routes, as the portal server addresses them (behind nginx at
 * demos.exyconn.com/calling-bot-demo/api) and as the voice server mounts them.
 */
export const VOICE_PATHS = {
  health: '/health',
  /** WebSocket: a browser call's audio, both ways. */
  browser: '/browser',
  /** Vobiz answer_url: returns the XML that streams the call's audio to `vobizStream`. */
  vobizAnswer: '/vobiz/answer',
  /** Vobiz hangup_url: the end of a phone call. */
  vobizHangup: '/vobiz/hangup',
  /** WebSocket: a phone call's audio, both ways, from Vobiz. */
  vobizStream: '/vobiz/stream',
  /** Twilio's call Url: returns the TwiML that streams the call's audio to `twilioStream`. */
  twilioAnswer: '/twilio/answer',
  /** Twilio's StatusCallback: the end of a phone call. */
  twilioStatus: '/twilio/status',
  /**
   * WebSocket: a phone call's audio, both ways, from Twilio. Twilio's stream URL takes no
   * query string, so this one reads its ticket from the stream's first `start` message.
   */
  twilioStream: '/twilio/stream',
} as const;

/** The query parameter every route reads its call ticket from. */
export const TICKET_PARAM = 'ticket';
