import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
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

interface LiveEditToolbarProps {
  title: string;
  /** Public URL of the page being edited. */
  pageUrl: string;
  dirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

/** The bar above the canvas: back, what is being edited, save state, view on site, save. */
export function LiveEditToolbar({
  title,
  pageUrl,
  dirty,
  saving,
  onBack,
  onSave,
}: Readonly<LiveEditToolbarProps>) {
  const t = useT();
  const backLabel = t('Back to the list');
  const saveState = dirty ? t('Unsaved changes') : t('All changes saved');
  const saveLabel = saving ? t('Saving…') : t('Save');

  return (
    <Flex
      alignItems="center"
      gap={1.5}
      sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Tooltip title={backLabel}>
        <IconButton aria-label={backLabel} onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      <Flex direction="column" sx={{ minWidth: 0, flexGrow: 1 }}>
        <Text size="caption" color="text.secondary">
          {t('Live edit')}
        </Text>
        <Text weight="semibold" noWrap>
          {title}
        </Text>
      </Flex>
      <Chip
        size="small"
        label={saveState}
        color={dirty ? 'warning' : 'success'}
        variant="outlined"
      />
      <Button
        variant="outlined"
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewIcon />}
      >
        {t('View on site')}
      </Button>
      <Button
        variant="contained"
        disabled={!dirty || saving}
        onClick={onSave}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
      >
        {saveLabel}
      </Button>
    </Flex>
  );
}
