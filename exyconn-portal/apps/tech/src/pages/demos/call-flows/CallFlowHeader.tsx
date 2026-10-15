import { useT } from '@exyconn/i18n';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Button, Chip, Typography } from '@exyconn/shell/components/ui';

interface CallFlowHeaderProps {
  title: string;
  hasFlow: boolean;
  dirty: boolean;
  errors: number;
  busy: boolean;
  onTidy: () => void;
  onRehearse: () => void;
  onScript: () => void;
  onSave: () => void;
  onRemove: () => void;
}

/** The example's name and state, and what can be done with its flow. */
export function CallFlowHeader(props: Readonly<CallFlowHeaderProps>) {
  const t = useT();
  const { dirty, errors, busy, hasFlow } = props;
  const state = dirty ? t('Unsaved changes') : t('Saved');
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }} noWrap>
          {props.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Chip
            size="small"
            label={hasFlow ? state : t('No flow yet: a starter is shown')}
            color={dirty ? 'warning' : 'default'}
          />
          {errors > 0 && (
            <Chip size="small" color="error" label={t('{count} problems', { count: errors })} />
          )}
        </Box>
      </Box>
      <Button size="small" startIcon={<AutoFixHighIcon />} onClick={props.onTidy}>
        {t('Tidy')}
      </Button>
      <Button size="small" startIcon={<RecordVoiceOverIcon />} onClick={props.onRehearse}>
        {t('Rehearse')}
      </Button>
      <Button
        size="small"
        startIcon={<DescriptionOutlinedIcon />}
        onClick={props.onScript}
        disabled={!hasFlow}
      >
        {t('Call script')}
      </Button>
      <Button
        size="small"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={props.onRemove}
        disabled={!hasFlow || busy}
      >
        {t('Remove flow')}
      </Button>
      <Button
        size="small"
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={props.onSave}
        disabled={busy || errors > 0 || !dirty}
      >
        {t('Save')}
      </Button>
    </Box>
  );
}
