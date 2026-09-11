import type { ReactElement } from 'react';
import { copyrightNotice } from '@exyconn/tracker-core';
import { Box, Typography } from '@exyconn/ui';
import type { Branding } from '@shared/types';

interface Props {
  branding: Branding | null;
}

export default function AppFooter({ branding }: Readonly<Props>): ReactElement {
  return (
    <Box sx={{ flexShrink: 0, px: 2, pb: 1.5, textAlign: 'center' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {copyrightNotice(branding)}
      </Typography>
    </Box>
  );
}
