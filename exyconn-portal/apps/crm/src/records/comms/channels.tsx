import type { ReactNode } from 'react';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import type { CommsChannel } from './commsStore';

/** Each channel's name (English source) and icon, shared by the buttons, pills and panels. */
export const CHANNELS: Readonly<Record<CommsChannel, { label: string; icon: ReactNode }>> = {
  CALL: { label: 'Call', icon: <CallIcon /> },
  SMS: { label: 'SMS', icon: <SmsIcon /> },
  EMAIL: { label: 'Email', icon: <EmailIcon /> },
};
