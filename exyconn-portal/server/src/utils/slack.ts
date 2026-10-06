import { SlackConfigModel, type SlackConfigDocument } from '../modules/tech/slack-config.model';
import { logger } from './logger';
import { ConfigurationError } from './errors';

const SLACK_API_URL = 'https://slack.com/api';

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

/** A channel the bot token can see, as the portal offers it for selection. */
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
}

interface ChannelPayload {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
}

interface ConversationsListResponse extends SlackApiResponse {
  channels?: ChannelPayload[];
  response_metadata?: { next_cursor?: string };
}

interface PostMessageResponse extends SlackApiResponse {
  channel: string;
  ts: string;
}

interface UserLookupResponse extends SlackApiResponse {
  user?: { id: string; real_name?: string; profile?: { email?: string; real_name?: string } };
}

/** Where a posted message landed: the conversation and the message's timestamp (its id). */
export interface SlackPost {
  channel: string;
  ts: string;
}

/** A Slack member as the website chat knows them. */
export interface SlackMember {
  id: string;
  name: string;
  email: string;
}

/** Slack pages this endpoint; 200 per page keeps a typical workspace to one call. */
const CHANNELS_PAGE_SIZE = 200;

function toMember(user: NonNullable<UserLookupResponse['user']>): SlackMember {
  return {
    id: user.id,
    name: user.profile?.real_name || user.real_name || user.id,
    email: user.profile?.email ?? '',
  };
}

/**
 * Slack notifier (singleton). The bot token is loaded from the active Slack
 * config in the Admin module's Environment Variables screen (DB-backed, no env
 * dependency), so rotating it never needs a redeploy.
 */
class SlackNotifier {
  /** Calls one Slack Web API method with the given config's bot token. */
  private async call<T extends SlackApiResponse>(
    config: SlackConfigDocument,
    method: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${SLACK_API_URL}/${method}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as T;
    if (!payload.ok) {
      throw new Error(`Slack ${method} failed: ${payload.error ?? 'unknown error'}`);
    }
    return payload;
  }

  /** Loads the single active Slack config, or throws. */
  private async getActiveConfig(): Promise<SlackConfigDocument> {
    const config = await SlackConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new ConfigurationError(
        'No active Slack configuration. Add one in Admin › Environment Variables.',
      );
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
   * Posts to a conversation (a channel, or a member's id for a direct message from the app),
   * optionally as a reply in a thread, and says where it landed.
   */
  async post(channel: string, text: string, threadTs?: string): Promise<SlackPost> {
    const config = await this.getActiveConfig();
    const result = await this.call<PostMessageResponse>(config, 'chat.postMessage', {
      channel,
      text,
      ...(threadTs ? { thread_ts: threadTs } : {}),
    });
    return { channel: result.channel, ts: result.ts };
  }

  /** The Slack member with this email (needs the users:read.email scope), or null. */
  async memberByEmail(email: string): Promise<SlackMember | null> {
    const config = await this.getActiveConfig();
    try {
      const result = await this.call<UserLookupResponse>(config, 'users.lookupByEmail', { email });
      return result.user ? toMember(result.user) : null;
    } catch (error) {
      logger.warn({ err: error }, 'Slack member lookup by email failed');
      return null;
    }
  }

  /** The Slack member behind an id, as their profile says (name and email). */
  async member(id: string): Promise<SlackMember | null> {
    const config = await this.getActiveConfig();
    const result = await this.call<UserLookupResponse>(config, 'users.info', { user: id });
    return result.user ? toMember(result.user) : null;
  }

  /** The active config's signing secret, or '' when none is stored. */
  async signingSecret(): Promise<string> {
    const config = await SlackConfigModel.findOne({ isActive: true })
      .select('signingSecret')
      .lean();
    return config?.signingSecret ?? '';
  }

  /**
   * Every channel the active bot token can see, public and private, sorted by
   * name. Paged through, because Slack caps a page at 1000 conversations.
   */
  async listChannels(): Promise<SlackChannel[]> {
    const config = await this.getActiveConfig();
    const channels: SlackChannel[] = [];
    let cursor = '';

    do {
      const page = await this.call<ConversationsListResponse>(config, 'conversations.list', {
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: CHANNELS_PAGE_SIZE,
        cursor: cursor || undefined,
      });
      for (const channel of page.channels ?? []) {
        channels.push({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private,
          isMember: channel.is_member,
        });
      }
      cursor = page.response_metadata?.next_cursor ?? '';
    } while (cursor);

    return channels.sort((a, b) => a.name.localeCompare(b.name));
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
