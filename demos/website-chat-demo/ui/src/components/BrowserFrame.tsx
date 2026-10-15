import type { ReactNode } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { Box, Paper, Typography } from '@exyconn/shell/components/ui';

/** A browser window around a demo website, so it reads as a real site with the agent on it. */
export function BrowserFrame({
  address,
  children,
}: Readonly<{ address: string; children: ReactNode }>) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1,
          bgcolor: 'action.hover',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box aria-hidden sx={{ display: 'flex', gap: 0.75 }}>
          {['error.light', 'warning.light', 'success.light'].map((color) => (
            <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
          ))}
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            bgcolor: 'background.paper',
            borderRadius: 1,
            minWidth: 0,
          }}
        >
          <LockIcon sx={{ fontSize: 14, color: 'success.main' }} aria-hidden />
          <Typography variant="caption" noWrap>
            {address}
          </Typography>
        </Box>
      </Box>
      {children}
    </Paper>
  );
}
