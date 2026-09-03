import { SlackConfigModel, type SlackConfigDocument } from '../modules/tech/slack-config.model';
import { logger } from './logger';

const SLACK_API_URL = 'https://slack.com/api';

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

/**
 * Slack notifier (singleton). The bot token is loaded from the active Slack
 * config in the Admin module's Environment Variables screen (DB-backed, no env
 * dependency), so rotating it never needs a redeploy.
 */
class SlackNotifier {
  /** Calls one Slack Web API method with the given config's bot token. */
  private async call(
    config: SlackConfigDocument,
    method: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(`${SLACK_API_URL}/${method}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as SlackApiResponse;
    if (!payload.ok) {
      throw new Error(`Slack ${method} failed: ${payload.error ?? 'unknown error'}`);
    }
  }

  /** Loads the single active Slack config, or throws. */
  private async getActiveConfig(): Promise<SlackConfigDocument> {
    const config = await SlackConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new Error('No active Slack configuration. Add one in Admin › Environment Variables.');
    }
    return config;
  }

  /** Posts a message through the active config, to its default channel by default. */
  async sendMessage(text: string, channel?: string): Promise<void> {
    const config = await this.getActiveConfig();
    const target = channel ?? config.defaultChannel;
    await this.call(config, 'chat.postMessage', { channel: target, text });
    logger.info(`Slack message posted to ${target}`);
  }

  /**
   * Verifies a bot token and posts a message through an explicit config (not
   * necessarily the active one) so an admin can validate it before activating.
   */
  async sendTestMessage(config: SlackConfigDocument, channel: string): Promise<void> {
    await this.call(config, 'auth.test', {});
    const text = `:white_check_mark: Exyconn Portal — Slack test message from the "${config.label}" configuration. If you can read this, the bot token and channel are working.`;
    await this.call(config, 'chat.postMessage', { channel, text });
    logger.info(`Slack test message posted to ${channel} via config "${config.label}"`);
  }
}

export const slackNotifier = new SlackNotifier();
