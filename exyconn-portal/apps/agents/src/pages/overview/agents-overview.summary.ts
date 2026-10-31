import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import type { OverviewBreakdown } from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { AgentsOverviewQuery } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

export type AgentsOverview = AgentsOverviewQuery['agentsOverview'];

/** How many days the overview covers. */
export const OVERVIEW_DAYS = 30;

/** Formats a 0-to-1 share as a percentage in the person's locale. */
export type PercentOf = (share: number) => string;

/** The four tiles: conversations, leads, calls and how many chats the bots handled alone. */
export function overviewStats(
  overview: AgentsOverview | undefined,
  percent: PercentOf,
): StatItem[] {
  return [
    {
      label: 'Conversations, {days}d',
      labelValues: { days: OVERVIEW_DAYS },
      value: String(overview?.conversations ?? 0),
      accent: color.emerald[600],
      icon: ForumOutlinedIcon,
      info: 'WhatsApp and website agent sessions, live website chats and calls together.',
    },
    {
      label: 'Leads captured, {days}d',
      labelValues: { days: OVERVIEW_DAYS },
      value: String(overview?.leadsCaptured ?? 0),
      accent: color.violet[400],
      icon: PersonAddAlt1OutlinedIcon,
    },
    {
      label: 'Calls, {days}d',
      labelValues: { days: OVERVIEW_DAYS },
      value: String(overview?.calls ?? 0),
      accent: color.blue[400],
      icon: PhoneInTalkOutlinedIcon,
    },
    {
      label: 'Deflection',
      value: percent(overview?.deflectionRate ?? 0),
      accent: color.amber[500],
      icon: SmartToyOutlinedIcon,
      info: 'Share of live website chats that ended without anyone on the team replying.',
    },
  ];
}

/** Where the conversations came from, how the calls went, and who answered the website. */
export function overviewBreakdowns(overview: AgentsOverview | undefined): OverviewBreakdown[] {
  const chats = overview?.websiteChats ?? 0;
  const byPeople = overview?.websiteChatsAnsweredByPeople ?? 0;
  const calls = overview?.calls ?? 0;
  const completed = overview?.callsCompleted ?? 0;
  const failed = overview?.callsFailed ?? 0;
  return [
    {
      title: 'Conversations by agent',
      buckets: [
        { value: 'WhatsApp agent', count: overview?.whatsappSessions ?? 0 },
        { value: 'Website chat agent', count: overview?.websiteAgentSessions ?? 0 },
        { value: 'Live website chats', count: chats },
        { value: 'Calling bot', count: calls },
      ],
      accent: color.emerald[600],
    },
    {
      title: 'Calls by outcome',
      buckets: [
        { value: 'Completed', count: completed },
        { value: 'Failed', count: failed },
        { value: 'Other', count: Math.max(0, calls - completed - failed) },
      ],
      accent: color.blue[400],
    },
    {
      title: 'Live website chats',
      buckets: [
        { value: 'Bot only', count: Math.max(0, chats - byPeople) },
        { value: 'A person replied', count: byPeople },
      ],
      accent: color.amber[500],
    },
  ];
}
