import type { ReactNode } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Chip,
  CircularProgress,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';

export interface BuilderToolbarProps {
  title: string;
  /** What is being edited: "Page /about-us", "Header fragment". */
  caption: string;
  status: string;
  dirty: boolean;
  saving: boolean;
  publishing: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onPreview?: () => void;
  /** Shows or hides the live preview beside the canvas. */
  onToggleLive?: () => void;
  liveOpen?: boolean;
  onSettings?: () => void;
  onRevisions?: () => void;
}

function ToolButton({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon: ReactNode; onClick?: () => void }>) {
  if (!onClick) return null;
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={onClick}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}

/** The bar above the canvas: back, what is edited and its state, then the document actions. */
export function BuilderToolbar(props: Readonly<BuilderToolbarProps>) {
  const t = useT();
  const { dirty, saving, publishing } = props;
  const saveState = dirty ? t('Unsaved changes') : t('All changes saved');
  const busyIcon = <CircularProgress size={16} color="inherit" />;

  return (
    <Flex
      alignItems="center"
      gap={1}
      sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <ToolButton label={t('Back')} icon={<ArrowBackIcon />} onClick={props.onBack} />
      <Flex direction="column" sx={{ minWidth: 0, flexGrow: 1 }}>
        <Text size="caption" color="text.secondary" noWrap>
          {props.caption}
        </Text>
        <Text weight="semibold" noWrap>
          {props.title}
        </Text>
      </Flex>
      <StatusChip value={props.status} />
      <Chip
        size="small"
        label={saveState}
        color={dirty ? 'warning' : 'success'}
        variant="outlined"
      />
      <ToolButton label={t('Settings')} icon={<TuneIcon />} onClick={props.onSettings} />
      <ToolButton label={t('Revisions')} icon={<HistoryIcon />} onClick={props.onRevisions} />
      <ToolButton
        label={props.liveOpen ? t('Hide live preview') : t('Show live preview')}
        icon={<VerticalSplitIcon color={props.liveOpen ? 'primary' : 'inherit'} />}
        onClick={props.onToggleLive}
      />
      <ToolButton label={t('Preview')} icon={<VisibilityIcon />} onClick={props.onPreview} />
      <Button
        variant="outlined"
        disabled={saving || publishing}
        onClick={props.onSave}
        startIcon={saving ? busyIcon : <SaveIcon />}
      >
        {t('Save draft')}
      </Button>
      <Button
        variant="contained"
        disabled={saving || publishing}
        onClick={props.onPublish}
        startIcon={publishing ? busyIcon : <PublishIcon />}
      >
        {t('Publish')}
      </Button>
    </Flex>
  );
}
