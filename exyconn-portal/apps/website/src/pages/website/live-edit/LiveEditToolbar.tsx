import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
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
  return (
    <Flex
      alignItems="center"
      gap={1.5}
      sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Tooltip title="Back to the list">
        <IconButton aria-label="Back to the list" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      <Flex direction="column" sx={{ minWidth: 0, flexGrow: 1 }}>
        <Text size="caption" color="text.secondary">
          Live edit
        </Text>
        <Text weight="semibold" noWrap>
          {title}
        </Text>
      </Flex>
      <Chip
        size="small"
        label={dirty ? 'Unsaved changes' : 'All changes saved'}
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
        View on site
      </Button>
      <Button
        variant="contained"
        disabled={!dirty || saving}
        onClick={onSave}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </Flex>
  );
}
