import type { ReactNode } from 'react';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { Box, Stack, Text } from '@/components/ui';

type NoticeTone = 'info' | 'error';

interface MapNoticeProps {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
}

/** Fills the map's box when there is no map to show: why, and what to do about it. */
export function MapNotice({ tone, title, children }: Readonly<MapNoticeProps>) {
  const isError = tone === 'error';
  const Icon = isError ? ErrorOutlineIcon : MapOutlinedIcon;
  return (
    <Box
      role={isError ? 'alert' : 'status'}
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'action.hover',
        border: 1,
        borderColor: isError ? 'error.main' : 'divider',
        borderStyle: 'dashed',
        borderRadius: 1,
        overflowY: 'auto',
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center', maxWidth: 440, textAlign: 'center' }}>
        <Icon color={isError ? 'error' : 'action'} fontSize="large" aria-hidden />
        <Text weight="bold">{title}</Text>
        <Text size="sm" color="text.secondary" component="div">
          {children}
        </Text>
      </Stack>
    </Box>
  );
}
