import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WindowControls from './WindowControls';
import { DRAG } from '../window-drag';

interface Props {
  title: string;
  /** Extra controls placed before the window buttons. Each must opt out of the drag region. */
  actions?: ReactNode;
}

/**
 * A minimal frameless title bar for windows that have no app chrome of their own.
 *
 * The tracker window's own header does this job (it is the title bar); the gallery and the
 * signed-out screens have no header, and a frameless window without one cannot be dragged or
 * closed at all.
 */
export default function TitleBar({ title, actions }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        flexShrink: 0,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...DRAG,
      })}
    >
      <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {actions}
      <WindowControls />
    </Box>
  );
}
