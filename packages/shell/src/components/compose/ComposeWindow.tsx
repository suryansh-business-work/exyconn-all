import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { Box, Flex, IconButton, Paper, Text, Tooltip } from '@/components/ui';
import { useComposeWindow, type ComposeSize } from './useComposeWindow';

interface ComposeWindowProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** The window's width at each size; a phone always gets the full width. */
function widthOf(size: ComposeSize) {
  if (size === 'maximized') {
    return 'min(1100px, calc(100vw - 48px))';
  }
  return size === 'minimized' ? 320 : 560;
}

/**
 * A mail-style compose window: docked to the bottom-right corner over the page without
 * blocking it, dragged by its title bar, minimised to that bar or maximised to most of the
 * screen. The page beneath stays usable throughout — no backdrop, no focus trap.
 */
export function ComposeWindow({ open, title, onClose, children }: Readonly<ComposeWindowProps>) {
  const t = useT();
  const { size, offset, resize, dragHandlers } = useComposeWindow();
  if (!open) {
    return null;
  }
  const maximized = size === 'maximized';
  const minimized = size === 'minimized';

  return (
    <Paper
      role="dialog"
      aria-label={title}
      elevation={8}
      sx={{
        position: 'fixed',
        zIndex: (theme) => theme.zIndex.modal - 1,
        right: { xs: 0, sm: 24 },
        bottom: 0,
        width: { xs: '100%', sm: widthOf(size) },
        height: maximized ? 'calc(100vh - 96px)' : undefined,
        maxHeight: 'calc(100vh - 80px)',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        display: 'flex',
        flexDirection: 'column',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
      }}
    >
      <Flex
        direction="row"
        alignItems="center"
        {...dragHandlers}
        onDoubleClick={() => resize(minimized ? 'normal' : 'minimized')}
        sx={{
          px: 2,
          py: 0.5,
          gap: 0.5,
          bgcolor: 'action.selected',
          cursor: size === 'normal' ? 'move' : 'default',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <Text weight="semibold" size="sm" noWrap sx={{ flex: 1 }}>
          {title}
        </Text>
        <Tooltip title={minimized ? t('Restore') : t('Minimise')}>
          <IconButton
            size="small"
            aria-label={minimized ? t('Restore') : t('Minimise')}
            onClick={() => resize(minimized ? 'normal' : 'minimized')}
          >
            <MinimizeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={maximized ? t('Exit full screen') : t('Full screen')}>
          <IconButton
            size="small"
            aria-label={maximized ? t('Exit full screen') : t('Full screen')}
            onClick={() => resize(maximized ? 'normal' : 'maximized')}
          >
            {maximized ? (
              <CloseFullscreenIcon fontSize="small" />
            ) : (
              <OpenInFullIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Close')}>
          <IconButton size="small" aria-label={t('Close')} onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
      {/* Kept mounted while minimised, so a half-written message is not lost. */}
      <Box sx={{ display: minimized ? 'none' : 'block', p: 2, overflowY: 'auto', flex: 1 }}>
        {children}
      </Box>
    </Paper>
  );
}
