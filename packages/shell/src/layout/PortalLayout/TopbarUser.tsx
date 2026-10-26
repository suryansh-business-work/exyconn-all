import { useState } from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Box, IconButton, Tooltip, Typography, fontWeight } from '@/components/ui';
import { useT } from '@exyconn/i18n';
import { roleLabel } from '@/auth/roles';

interface TopbarUserProps {
  name?: string;
  roles: readonly string[];
}

/**
 * The signed-in person's name, with their roles behind an info button rather than spelled
 * out beneath it — ten roles as one comma line was a two-line wall of text on a wide screen.
 * The tooltip opens on hover, on keyboard focus and on a tap, so it reads the same on a phone.
 */
export function TopbarUser({ name, roles }: Readonly<TopbarUserProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const list = (
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {roles.map((role) => (
        <li key={role}>{t(roleLabel(role))}</li>
      ))}
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 1 }}>
      <Typography
        variant="caption"
        noWrap
        sx={{ fontWeight: fontWeight.bold, display: { xs: 'none', sm: 'block' } }}
      >
        {name}
      </Typography>
      <Tooltip
        title={list}
        describeChild
        arrow
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        // No enter delay: its pending timer survives Escape and would reopen the list.
        enterDelay={0}
        enterTouchDelay={0}
      >
        <IconButton size="small" aria-label={t('Your roles')} onClick={() => setOpen(true)}>
          <InfoOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
