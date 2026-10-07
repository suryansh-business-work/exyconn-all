import {
  chatSettingsView,
  readChatSettings,
  updateChatSettings,
  widgetConfig,
} from '../../../../src/modules/website-chat/chat.settings';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { ChatFaqModel, ChatSettingsModel } from '../../../../src/modules/website-chat/models';
import { freezeClock } from '../../../helpers';
import { fakePeer, framesOf, validSettings } from './chat.fixtures';

afterEach(() => {
  jest.useRealTimers();
  for (const peer of [...chatHub.all()]) {
    chatHub.leave(peer);
  }
});

describe('readChatSettings', () => {
  it('creates the defaults the first time and reads the same row after', async () => {
    const first = await readChatSettings();
    expect(first).toMatchObject({
      enabled: true,
      botName: 'Exyconn Assistant',
      timezone: 'Asia/Kolkata',
      noReplyTimeoutSeconds: 120,
      agentIds: [],
    });
    expect(first.weeklyHours.map((day) => day.enabled)).toEqual([
      false,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
    const again = await readChatSettings();
    expect(String(again._id)).toBe(String(first._id));
    expect(await ChatSettingsModel.countDocuments()).toBe(1);
  });
});

describe('chatSettingsView', () => {
  it('says the team is online inside opening hours', async () => {
    // Monday 10:30 in Kolkata.
    freezeClock('2026-10-05T05:00:00Z');
    expect((await chatSettingsView()).online).toBe(true);
  });

  it('says the team is offline at the weekend', async () => {
    // Sunday 10:30 in Kolkata.
    freezeClock('2026-10-04T05:00:00Z');
    const view = await chatSettingsView();
    expect(view.online).toBe(false);
    expect(view.botName).toBe('Exyconn Assistant');
  });
});

describe('widgetConfig', () => {
  it("gives a widget the copy, the hours and the active FAQs in the team's order", async () => {
    freezeClock('2026-10-05T05:00:00Z');
    await ChatFaqModel.create([
      { question: 'Second?', answer: 'B', sortOrder: 2 },
      { question: 'Hidden?', answer: 'C', sortOrder: 0, isActive: false },
      { question: 'First?', answer: 'A', sortOrder: 1 },
    ]);
    const config = await widgetConfig();
    expect(config).toMatchObject({
      enabled: true,
      botName: 'Exyconn Assistant',
      online: true,
      timezone: 'Asia/Kolkata',
      allowUploads: true,
      maxUploadMb: 10,
      soundEnabledByDefault: true,
    });
    expect(config.weeklyHours[1]).toEqual({ day: 1, enabled: true, start: '09:00', end: '18:00' });
    expect(config.faqs.map(({ question, answer }) => [question, answer])).toEqual([
      ['First?', 'A'],
      ['Second?', 'B'],
    ]);
    expect(config.faqs[0].id).toMatch(/^[a-f\d]{24}$/);
    expect(config).not.toHaveProperty('refusalMessage');
  });
});

describe('updateChatSettings', () => {
  it('saves the settings and pushes the new config to every open widget', async () => {
    const visitor = fakePeer({ role: 'visitor' });
    const staff = fakePeer({ role: 'staff' });
    chatHub.join(visitor.peer);
    chatHub.join(staff.peer);

    const view = await updateChatSettings({ ...validSettings(), botName: 'Exy', maxUploadMb: 4 });

    expect(view).toMatchObject({ botName: 'Exy', maxUploadMb: 4 });
    expect(typeof view.online).toBe('boolean');
    expect(await ChatSettingsModel.countDocuments()).toBe(1);
    const frames = framesOf(visitor.socket);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ t: 'config', config: { botName: 'Exy', maxUploadMb: 4 } });
    expect(staff.socket.send).not.toHaveBeenCalled();
  });

  it('refuses invalid settings and leaves the stored ones alone', async () => {
    await readChatSettings();
    await expect(
      updateChatSettings({ ...validSettings(), timezone: 'Nowhere/Land', botName: 'Changed' }),
    ).rejects.toThrow('Choose a valid timezone.');
    expect((await readChatSettings()).botName).toBe('Exyconn Assistant');
  });
});
