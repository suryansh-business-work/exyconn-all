import { getItSettings } from '../../../../src/modules/itsm/settings';
import { ItSettingsModel } from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, itMutation as m, itQuery as q, itStaff } from './itsm.fixtures';

const settingsInput = {
  applications: ['Email', 'Slack'],
  onboardingApplications: ['email'],
  ticketTopics: [' Hardware ', ''],
  warrantyWarningDays: 45,
  renewalWarningDays: 20,
  certificateWarningDays: 14,
};

describe('IT settings', () => {
  useTestOrganization();

  it('creates the defaults the first time and reuses them afterwards', async () => {
    const first = await getItSettings();
    const second = await getItSettings();

    expect(first).toMatchObject({
      key: 'global',
      applications: [],
      warrantyWarningDays: 60,
      renewalWarningDays: 30,
      certificateWarningDays: 30,
    });
    expect(String(second._id)).toBe(String(first._id));
    expect(await ItSettingsModel.countDocuments()).toBe(1);
  });

  it('reads the settings for IT', async () => {
    const { ctx } = await itStaff();

    const settings = (await q.itSettings(null, {}, ctx)) as { key: string };

    expect(settings.key).toBe('global');
  });

  it('saves the warning periods and matches onboarding apps case-insensitively', async () => {
    const { ctx } = await itStaff();

    const saved = (await m.updateItSettings(null, { input: settingsInput }, ctx)) as {
      onboardingApplications: string[];
      ticketTopics: string[];
      warrantyWarningDays: number;
      certificateWarningDays: number;
    };

    expect(saved).toMatchObject({
      onboardingApplications: ['email'],
      ticketTopics: ['Hardware'],
      warrantyWarningDays: 45,
      certificateWarningDays: 14,
    });
    expect(await ItSettingsModel.countDocuments()).toBe(1);
  });

  it('refuses a warning period below one day', async () => {
    const { ctx } = await itStaff();

    await expect(
      m.updateItSettings(null, { input: { ...settingsInput, renewalWarningDays: 0 } }, ctx),
    ).rejects.toThrow();
  });

  it('keeps everyone outside IT out of the settings', async () => {
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    expect(await codeOf(q.itSettings(null, {}, employee))).toBe('FORBIDDEN');
    expect(await codeOf(m.updateItSettings(null, { input: settingsInput }, employee))).toBe(
      'FORBIDDEN',
    );
  });
});
