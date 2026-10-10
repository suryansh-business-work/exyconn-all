import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  DEFAULT_CHAT_ALERT_PREFS,
  readChatAlertPrefs,
  saveChatAlertPrefs,
} from '../../../../../src/pages/chat/alerts/chatAlertPrefs';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

const STORAGE_KEY = 'exyconn.website.chat-alerts';

describe('chat alert preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(portalLogger.warn).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rings and animates, without desktop notifications, until the person chooses', () => {
    expect(DEFAULT_CHAT_ALERT_PREFS).toEqual({ sound: true, desktop: false, animate: true });
    expect(readChatAlertPrefs()).toBe(DEFAULT_CHAT_ALERT_PREFS);
  });

  it('reads back what was saved in this browser', () => {
    const prefs = { sound: false, desktop: true, animate: false };
    saveChatAlertPrefs(prefs);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(prefs);
    expect(readChatAlertPrefs()).toEqual(prefs);
  });

  it('fills in any choice an older save did not have from the defaults', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ desktop: true }));
    expect(readChatAlertPrefs()).toEqual({ sound: true, desktop: true, animate: true });
  });

  it('fills in desktop notifications as off when an older save only knew sound', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: false }));
    expect(readChatAlertPrefs()).toEqual({ sound: false, desktop: false, animate: true });
  });

  it('falls back to the defaults and logs when the saved value is not JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    expect(readChatAlertPrefs()).toBe(DEFAULT_CHAT_ALERT_PREFS);
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Could not read the chat alert preferences',
      expect.any(SyntaxError),
    );
  });

  it('logs instead of failing when the browser refuses to store the choice', () => {
    const refused = new Error('Storage is full');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw refused;
    });

    expect(() => saveChatAlertPrefs(DEFAULT_CHAT_ALERT_PREFS)).not.toThrow();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Could not save the chat alert preferences',
      refused,
    );
  });
});
