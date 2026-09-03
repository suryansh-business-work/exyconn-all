import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WindowControls from './WindowControls';

interface Props {
  title: string;
}

/**
 * A minimal frameless title bar for windows that have no app chrome of their own.
 *
 * The tracker window's own header does this job (it is the title bar); the gallery has no
 * header, and a frameless window without one cannot be dragged or closed at all.
 */
export default function TitleBar({ title }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        flexShrink: 0,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        WebkitAppRegion: 'drag',
      })}
    >
      <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      <WindowControls />
    </Box>
  );
}
