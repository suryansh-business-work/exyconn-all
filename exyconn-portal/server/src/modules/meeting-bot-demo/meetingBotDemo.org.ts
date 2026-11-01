import { env } from '../../config/env';
import { ROLES } from '../../constants/roles';
import { runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { getMaSettings } from '../meeting-assistant/settings.service';
import { MaSettingsModel } from '../meeting-assistant/models';
import {
  ensureDemoOrganization,
  type DemoOrganization,
  type DemoOrganizationSpec,
} from '../organizations';

/**
 * The company every meeting bot demo call is recorded in. Visitors' meetings never reach a real
 * customer's data, and the demo account it acts as owns them all; each visitor only ever sees
 * the trips they started.
 */
const MEETING_DEMO: DemoOrganizationSpec = {
  slug: 'exyconn-meeting-bot-demo',
  name: 'Exyconn Meeting Bot Demo',
  industry: 'Software',
  description:
    'Public demo company: meetings recorded by the meeting bot demo on demos.exyconn.com.',
  currency: 'USD',
  country: 'US',
  timezone: 'UTC',
  account: {
    name: 'Exyconn Notetaker Demo',
    email: 'notetaker@exyconn-meeting-bot-demo.example',
    roles: [ROLES.EMPLOYEE, ROLES.AI],
  },
};

/** The demo company and the account the bot records for. */
export const meetingDemo = (): Promise<DemoOrganization> => ensureDemoOrganization(MEETING_DEMO);

/**
 * The demo company's Meeting Assistant settings, set from the demo's configuration on every
 * boot: the bot on, summaries made automatically, nothing emailed by the assistant itself (the
 * demo emails the visitor), and recordings and transcripts kept only as long as the demo keeps
 * the meeting.
 */
async function applyDemoSettings(): Promise<void> {
  const config = env.demos.meetingBot;
  await getMaSettings();
  await MaSettingsModel.updateOne(
    { key: 'global' },
    {
      $set: {
        enabled: true,
        allowedUserIds: [],
        botEnabled: true,
        botAutoJoin: false,
        autoGenerateSummary: true,
        autoEmail: false,
        emailParticipants: false,
        saveRecordings: true,
        audioRetentionDays: config.retentionDays,
        transcriptRetentionDays: config.retentionDays,
        maxMeetingMinutes: config.maxMeetingMinutes,
        updatedByName: 'Meeting bot demo',
      },
    },
  );
}

/** Boot: the demo company exists and its assistant is set up for the demo. Never stops boot. */
export async function ensureMeetingBotDemo(): Promise<void> {
  try {
    const demo = await meetingDemo();
    await runForOrganization(demo.organizationId, applyDemoSettings);
  } catch (error) {
    logger.error({ err: error }, 'Meeting bot demo could not be prepared');
  }
}
