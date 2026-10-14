import { useT } from '@exyconn/i18n';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT } from '../../../theme/wa.tokens';

/** The verified-business mark beside a name. */
export function VerifiedBadge({ color }: Readonly<{ color?: string }>) {
  const t = useT();
  const c = useWaPalette();
  return (
    <VerifiedIcon
      titleAccess={t('Verified business')}
      sx={{ color: color ?? c.verified, fontSize: WA_FONT.title, flexShrink: 0 }}
    />
  );
}
