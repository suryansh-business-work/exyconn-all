import type { ReactElement } from 'react';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CampaignIcon from '@mui/icons-material/Campaign';
import NoteIcon from '@mui/icons-material/StickyNote2';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { CrmTimelineKind } from '@exyconn/shell/graphql/generated';

export interface KindStyle {
  label: string;
  icon: ReactElement;
  /** A palette colour, so the dot reads in light and dark mode alike. */
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
}

/** How each kind of touchpoint reads on the timeline. */
export const KIND_STYLES: Record<CrmTimelineKind, KindStyle> = {
  [CrmTimelineKind.Note]: { label: 'Note', icon: <NoteIcon fontSize="small" />, color: 'warning' },
  [CrmTimelineKind.Call]: { label: 'Call', icon: <CallIcon fontSize="small" />, color: 'info' },
  [CrmTimelineKind.Email]: {
    label: 'Email',
    icon: <EmailIcon fontSize="small" />,
    color: 'primary',
  },
  [CrmTimelineKind.Meeting]: {
    label: 'Meeting',
    icon: <EventIcon fontSize="small" />,
    color: 'success',
  },
  [CrmTimelineKind.Task]: {
    label: 'Task',
    icon: <TaskAltIcon fontSize="small" />,
    color: 'secondary',
  },
  [CrmTimelineKind.Deal]: {
    label: 'Deal',
    icon: <HandshakeIcon fontSize="small" />,
    color: 'success',
  },
  [CrmTimelineKind.Lead]: {
    label: 'Lead',
    icon: <PersonAddIcon fontSize="small" />,
    color: 'info',
  },
  [CrmTimelineKind.FormSubmission]: {
    label: 'Website form',
    icon: <DescriptionIcon fontSize="small" />,
    color: 'primary',
  },
  [CrmTimelineKind.WebsiteChat]: {
    label: 'Website chat',
    icon: <ChatIcon fontSize="small" />,
    color: 'info',
  },
  [CrmTimelineKind.SupportTicket]: {
    label: 'Support',
    icon: <SupportAgentIcon fontSize="small" />,
    color: 'error',
  },
  [CrmTimelineKind.CampaignEmail]: {
    label: 'Campaign',
    icon: <CampaignIcon fontSize="small" />,
    color: 'secondary',
  },
  [CrmTimelineKind.SystemEmail]: {
    label: 'System email',
    icon: <MarkEmailReadIcon fontSize="small" />,
    color: 'primary',
  },
  [CrmTimelineKind.WhatsappLead]: {
    label: 'WhatsApp',
    icon: <WhatsAppIcon fontSize="small" />,
    color: 'success',
  },
};

/** The filter chips above the timeline: each groups the kinds a person thinks of together. */
export const KIND_FILTERS: ReadonlyArray<{
  id: string;
  label: string;
  kinds: readonly CrmTimelineKind[];
}> = [
  { id: 'all', label: 'All', kinds: Object.values(CrmTimelineKind) },
  {
    id: 'logged',
    label: 'Notes, calls & meetings',
    kinds: [
      CrmTimelineKind.Note,
      CrmTimelineKind.Call,
      CrmTimelineKind.Meeting,
      CrmTimelineKind.Task,
    ],
  },
  {
    id: 'email',
    label: 'Emails',
    kinds: [CrmTimelineKind.Email, CrmTimelineKind.CampaignEmail, CrmTimelineKind.SystemEmail],
  },
  {
    id: 'website',
    label: 'Website & chat',
    kinds: [
      CrmTimelineKind.FormSubmission,
      CrmTimelineKind.WebsiteChat,
      CrmTimelineKind.WhatsappLead,
    ],
  },
  { id: 'support', label: 'Support', kinds: [CrmTimelineKind.SupportTicket] },
  { id: 'sales', label: 'Leads & deals', kinds: [CrmTimelineKind.Lead, CrmTimelineKind.Deal] },
];
