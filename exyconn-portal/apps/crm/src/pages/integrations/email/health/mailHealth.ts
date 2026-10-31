import type { ComponentType } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import {
  MailHealthCheckCode,
  MailHealthCheckStatus,
  type MailDomainHealthFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type DomainHealth = MailDomainHealthFieldsFragment;
export type DomainHealthCheck = DomainHealth['checks'][number];

type HealthColor = 'success' | 'warning' | 'error' | 'default';

/** How each outcome looks, with its label as an English source string. */
export const STATUS_VIEW: Readonly<
  Record<MailHealthCheckStatus, { label: string; color: HealthColor; Icon: ComponentType }>
> = {
  [MailHealthCheckStatus.Pass]: { label: 'Pass', color: 'success', Icon: CheckCircleIcon },
  [MailHealthCheckStatus.Warn]: { label: 'Warning', color: 'warning', Icon: WarningIcon },
  [MailHealthCheckStatus.Fail]: { label: 'Failing', color: 'error', Icon: ErrorIcon },
  [MailHealthCheckStatus.Unknown]: {
    label: 'Not checked',
    color: 'default',
    Icon: HelpOutlineIcon,
  },
};

/** What each check is about, as English source strings. */
export const CHECK_LABELS: Readonly<Record<MailHealthCheckCode, string>> = {
  [MailHealthCheckCode.Spf]: 'SPF',
  [MailHealthCheckCode.Dkim]: 'DKIM',
  [MailHealthCheckCode.Dmarc]: 'DMARC',
  [MailHealthCheckCode.Mx]: 'MX',
  [MailHealthCheckCode.Blacklist]: 'Blocklists',
};

/** Ready from 80, needs work from 50, and needs attention below that. */
export function scoreColor(score: number): HealthColor {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

/** The part of an address after the @, which is what a domain's health is keyed by. */
export const domainOf = (email: string) => email.slice(email.lastIndexOf('@') + 1).toLowerCase();
