import type { SvgIconComponent } from '@mui/icons-material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { WhatsappDemoEventType } from '@exyconn/shell/graphql/generated';

export interface EventKind {
  icon: SvgIconComponent;
  /** English source, translated where shown. */
  label: string;
}

/** How each recorded event type reads in a session's timeline. */
export const EVENT_KINDS: Readonly<Record<WhatsappDemoEventType, EventKind>> = {
  [WhatsappDemoEventType.SessionStart]: { icon: PlayCircleOutlineIcon, label: 'Session started' },
  [WhatsappDemoEventType.SessionEnd]: { icon: StopCircleOutlinedIcon, label: 'Session ended' },
  [WhatsappDemoEventType.DemoOpened]: { icon: StorefrontOutlinedIcon, label: 'Industry opened' },
  [WhatsappDemoEventType.FlowStarted]: { icon: AccountTreeOutlinedIcon, label: 'Flow started' },
  [WhatsappDemoEventType.FlowCompleted]: { icon: CheckCircleOutlineIcon, label: 'Flow completed' },
  [WhatsappDemoEventType.FlowAbandoned]: { icon: HighlightOffIcon, label: 'Flow abandoned' },
  [WhatsappDemoEventType.Step]: { icon: ChatBubbleOutlineIcon, label: 'Step' },
  [WhatsappDemoEventType.ReminderDelivered]: {
    icon: NotificationsActiveOutlinedIcon,
    label: 'Reminder delivered',
  },
  [WhatsappDemoEventType.DocumentOpened]: {
    icon: DescriptionOutlinedIcon,
    label: 'Document opened',
  },
  [WhatsappDemoEventType.QrOpened]: { icon: QrCode2Icon, label: 'QR code opened' },
  [WhatsappDemoEventType.ChatCleared]: { icon: DeleteSweepOutlinedIcon, label: 'Chat cleared' },
  [WhatsappDemoEventType.AiCall]: { icon: AutoAwesomeOutlinedIcon, label: 'AI call' },
};

/** What an AI_CALL event's `meta` says about the call, read defensively — it is free JSON. */
export interface AiCallMeta {
  ok: boolean;
  latencyMs: number | null;
  error: string | null;
}

export function readAiMeta(meta: unknown): AiCallMeta | null {
  if (meta === null || typeof meta !== 'object') {
    return null;
  }
  const record = meta as Record<string, unknown>;
  return {
    ok: record.ok === true,
    latencyMs: typeof record.latencyMs === 'number' ? record.latencyMs : null,
    error: typeof record.error === 'string' ? record.error : null,
  };
}
