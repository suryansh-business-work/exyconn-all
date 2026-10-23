import type { MouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useT } from '@exyconn/i18n';
import { Flex, IconButton, Text, Tooltip } from '@/components/ui';

interface DockPanelHeaderProps {
  title: string;
  titleId: string;
  /** The header drags the panel: not on a phone, and not while it fills the screen. */
  draggable: boolean;
  maximized: boolean;
  onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

/**
 * A dock window's title bar: a drag handle, the title, and minimize, maximize/restore and close.
 * Double-clicking it (not its buttons) maximizes or restores the panel.
 */
export function DockPanelHeader({
  title,
  titleId,
  draggable,
  maximized,
  onDragStart,
  onToggleMaximize,
  onMinimize,
  onClose,
}: Readonly<DockPanelHeaderProps>) {
  const t = useT();
  const sizeLabel = maximized ? t('Restore size') : t('Maximize');
  const SizeIcon = maximized ? CloseFullscreenIcon : OpenInFullIcon;
  const onDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target as HTMLElement).closest('button')) {
      onToggleMaximize();
    }
  };

  return (
    <Flex
      direction="row"
      alignItems="center"
      spacing={1}
      onPointerDown={onDragStart}
      onDoubleClick={onDoubleClick}
      sx={{
        px: 1.5,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        cursor: draggable ? 'move' : 'default',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {draggable && <DragIndicatorIcon fontSize="small" color="action" aria-hidden />}
      <Text id={titleId} component="h2" weight="semibold" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
        {title}
      </Text>
      <Tooltip title={t('Minimize')}>
        <IconButton size="small" aria-label={t('Minimize')} onClick={onMinimize}>
          <MinimizeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={sizeLabel}>
        <IconButton size="small" aria-label={sizeLabel} onClick={onToggleMaximize}>
          <SizeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('Close')}>
        <IconButton size="small" aria-label={t('Close')} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}
