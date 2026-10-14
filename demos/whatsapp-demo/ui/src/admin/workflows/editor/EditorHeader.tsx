import { useT } from '@exyconn/i18n';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { WhatsappWorkflowStatus } from '@exyconn/shell/graphql/generated';
import { Box, Button, Chip, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { WorkflowStatusChip } from '../model/WorkflowStatusChip';

interface EditorHeaderProps {
  name: string;
  workflowKey: string;
  status: WhatsappWorkflowStatus;
  version: number;
  dirty: boolean;
  errors: number;
  busy: boolean;
  onBack: () => void;
  onDetails: () => void;
  onTidy: () => void;
  onPreview: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onPublish: () => void;
}

/** Name, status and the editor's actions; Publish waits until there are no errors. */
export function EditorHeader(props: Readonly<EditorHeaderProps>) {
  const t = useT();
  const { name, workflowKey, status, version, dirty, errors, busy } = props;
  const publishHint =
    errors > 0 ? t('Fix {count} errors to publish', { count: errors }) : t('Publish');
  // Nothing differs from the live version: there is nothing to publish or discard.
  const upToDate = status === WhatsappWorkflowStatus.Published && !dirty;
  return (
    <Flex
      direction="row"
      wrap
      alignItems="center"
      gap={1}
      sx={{
        px: { xs: 1, md: 2 },
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton aria-label={t('Back to workflows')} onClick={props.onBack}>
        <ArrowBackIcon />
      </IconButton>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Flex alignItems="center" gap={1}>
          <Text component="h1" size="lg" weight="semibold" noWrap>
            {name}
          </Text>
          <IconButton
            size="small"
            aria-label={t('Edit workflow details')}
            onClick={props.onDetails}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Flex>
        <Flex alignItems="center" gap={1} wrap>
          <Text size="caption" color="text.secondary">
            {workflowKey}
          </Text>
          <WorkflowStatusChip status={status} version={version} />
          {dirty && <Chip size="small" label={t('Unsaved changes')} />}
        </Flex>
      </Box>
      <Button size="small" startIcon={<AutoFixHighIcon />} onClick={props.onTidy}>
        {t('Tidy up')}
      </Button>
      <Button size="small" startIcon={<VisibilityIcon />} onClick={props.onPreview}>
        {t('Preview in WhatsApp')}
      </Button>
      <Button
        size="small"
        color="inherit"
        startIcon={<UndoIcon />}
        disabled={busy || version === 0 || upToDate}
        onClick={props.onDiscard}
      >
        {t('Discard draft')}
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<SaveIcon />}
        disabled={busy || !dirty}
        onClick={props.onSave}
      >
        {t('Save draft')}
      </Button>
      <Tooltip title={publishHint}>
        <span>
          <Button
            size="small"
            variant="contained"
            startIcon={<PublishIcon />}
            disabled={busy || errors > 0 || upToDate}
            onClick={props.onPublish}
          >
            {t('Publish')}
          </Button>
        </span>
      </Tooltip>
    </Flex>
  );
}
