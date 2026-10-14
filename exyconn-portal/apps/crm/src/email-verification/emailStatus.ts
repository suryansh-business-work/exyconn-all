import type { SvgIconComponent } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { EmailVerificationStatus } from '@exyconn/shell/graphql/generated';

/** What a badge says: a stored result, or that the address was never checked. */
export type EmailStatusKey = EmailVerificationStatus | 'NOT_CHECKED';

type ChipColor = 'success' | 'warning' | 'error' | 'default';

interface StatusView {
  label: string;
  color: ChipColor;
  Icon: SvgIconComponent;
}

/** One look per result, so a verified address reads the same on every CRM screen. */
export const EMAIL_STATUS_VIEW: Record<EmailStatusKey, StatusView> = {
  [EmailVerificationStatus.Verified]: {
    label: 'Verified',
    color: 'success',
    Icon: CheckCircleIcon,
  },
  [EmailVerificationStatus.Risky]: { label: 'Risky', color: 'warning', Icon: WarningAmberIcon },
  [EmailVerificationStatus.Invalid]: { label: 'Invalid', color: 'error', Icon: CancelIcon },
  [EmailVerificationStatus.Unknown]: { label: 'Unknown', color: 'default', Icon: HelpOutlineIcon },
  NOT_CHECKED: { label: 'Not checked', color: 'default', Icon: RadioButtonUncheckedIcon },
};
