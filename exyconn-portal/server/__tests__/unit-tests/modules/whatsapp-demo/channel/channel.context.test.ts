import { engineContext } from '../../../../../src/modules/whatsapp-demo/channel/channel.context';
import { aiStatus } from '../../../../../src/modules/whatsapp-demo/whatsappDemo.parse';
import * as i18nService from '../../../../../src/modules/i18n/i18n.service';
import { AppSettingsModel } from '../../../../../src/modules/admin/settings.model';
import { useTestOrganization } from '../../../../helpers';

jest.mock('../../../../../src/modules/whatsapp-demo/whatsappDemo.parse', () => ({
  aiStatus: jest.fn(),
}));

useTestOrganization({ locale: 'en-IN', timezone: 'UTC' });

const sender = { waId: '919800000001', name: '  Asha   Rao ' };
/** Wednesday 7 October 2026, 02:30 UTC. */
const MOMENT = Date.UTC(2026, 9, 7, 2, 30);

let readBundle: jest.SpyInstance;

beforeEach(() => {
  jest.mocked(aiStatus).mockResolvedValue({ configured: true, model: 'gpt' });
  readBundle = jest
    .spyOn(i18nService, 'readBundle')
    .mockResolvedValue([{ key: 'k', source: 'Choose', text: 'Choisir' }]);
});

afterEach(() => readBundle.mockRestore());

describe('engineContext', () => {
  it('falls back to the company language and timezone, and the default patterns', async () => {
    const ctx = await engineContext(sender);

    expect(readBundle).toHaveBeenCalledWith('en-IN');
    expect(ctx.format.date(MOMENT)).toBe('07 Oct 2026');
    expect(ctx.format.time(MOMENT)).toBe('02:30 AM');
    const day = ctx.format.day(MOMENT);
    const afterWed = day.slice(day.indexOf('Wed') + 'Wed'.length);
    expect(day).toContain('Wed');
    expect(afterWed).toContain('7');
    expect(afterWed.slice(afterWed.indexOf('7') + 1)).toContain('Oct');
  });

  it('writes demo prices in rupees in the company number style', async () => {
    const ctx = await engineContext(sender);

    expect(ctx.format.money(150000)).toBe('₹1,50,000');
    expect(ctx.format.money(99.6)).toBe('₹100');
  });

  it('uses the workspace settings once an administrator has saved them', async () => {
    await AppSettingsModel.create({
      key: 'global',
      timezone: 'America/New_York',
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm',
      defaultLocale: 'fr',
    });

    const ctx = await engineContext(sender);

    expect(readBundle).toHaveBeenCalledWith('fr');
    expect(ctx.format.date(MOMENT)).toBe('2026-10-06');
    expect(ctx.format.time(MOMENT)).toBe('22:30');
  });

  it('translates with the server catalogue, keeping the English source otherwise', async () => {
    const ctx = await engineContext(sender);

    expect(ctx.t('Choose')).toBe('Choisir');
    expect(ctx.t('Industries')).toBe('Industries');
  });

  it('exposes the WhatsApp sender to templates as the user', async () => {
    const ctx = await engineContext(sender);

    expect(ctx.user).toEqual({
      firstName: 'Asha',
      fullName: 'Asha   Rao',
      email: '',
      phone: '+919800000001',
    });
    expect(ctx.typingScale).toBe(0);
    expect(Math.abs(ctx.now - Date.now())).toBeLessThan(5_000);
  });

  it('leaves the names blank for a sender without one', async () => {
    const ctx = await engineContext({ waId: '911', name: '' });

    expect(ctx.user.firstName).toBe('');
    expect(ctx.user.fullName).toBe('');
  });

  it('offers the AI reader only when OpenAI is configured', async () => {
    expect((await engineContext(sender)).ai).toBe(true);

    jest.mocked(aiStatus).mockResolvedValue({ configured: false, model: null });
    expect((await engineContext(sender)).ai).toBe(false);
  });
});
