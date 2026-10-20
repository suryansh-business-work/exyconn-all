import { useT } from '@exyconn/i18n';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Button,
  Flex,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { CheckSeverity, type QualityCheckFieldsFragment } from '@exyconn/shell/graphql/generated';

const ICONS = {
  [CheckSeverity.Error]: <ErrorOutlineIcon color="error" fontSize="small" />,
  [CheckSeverity.Warning]: <WarningAmberIcon color="warning" fontSize="small" />,
  [CheckSeverity.Info]: <InfoOutlinedIcon color="info" fontSize="small" />,
};

const ORDER = [CheckSeverity.Error, CheckSeverity.Warning, CheckSeverity.Info];

interface QualityChecksPanelProps {
  checks: readonly QualityCheckFieldsFragment[] | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}

/** Every check before sending, errors first. Any error blocks the send. */
export function QualityChecksPanel({
  checks,
  loading,
  error,
  onRun,
}: Readonly<QualityChecksPanelProps>) {
  const t = useT();
  const sorted = [...(checks ?? [])].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
  );
  const errors = sorted.filter((check) => check.severity === CheckSeverity.Error).length;
  return (
    <Flex direction="column" spacing={1} aria-busy={loading}>
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <Text size="sm" weight="semibold">
          {t('Quality checks')}
        </Text>
        <Button size="small" startIcon={<RefreshIcon />} onClick={onRun} disabled={loading}>
          {t('Run checks')}
        </Button>
      </Flex>
      {error && <Alert severity="error">{t(error)}</Alert>}
      {loading && !checks && <Skeleton variant="rounded" height={120} />}
      {checks && (
        <Alert severity={errors ? 'error' : 'success'} role="status">
          {errors
            ? t('{count} problem(s) must be fixed before sending.', { count: errors })
            : t('Ready to send.')}
        </Alert>
      )}
      <List dense>
        {sorted.map((check) => (
          <ListItem key={`${check.code}-${check.line ?? ''}-${check.message}`} disableGutters>
            <ListItemIcon sx={{ minWidth: 32 }}>{ICONS[check.severity]}</ListItemIcon>
            <ListItemText
              primary={
                check.line
                  ? t('Line {line}: {message}', { line: check.line, message: check.message })
                  : check.message
              }
            />
          </ListItem>
        ))}
      </List>
    </Flex>
  );
}
