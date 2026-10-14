import { useT } from '@exyconn/i18n';
import type { GraphIssue } from '@exyconn/wa-flow';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import {
  Box,
  Flex,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Text,
} from '@exyconn/shell/components/ui';

interface ValidationPanelProps {
  issues: readonly GraphIssue[];
  /** Selects the node an issue is about and brings it into view. */
  onPick: (nodeId: string) => void;
}

/**
 * Issues have no id; their content is the key, with a counter for the rare exact repeat
 * (one output wired twice is reported once per extra wire).
 */
function keyed(issues: readonly GraphIssue[]): { key: string; issue: GraphIssue }[] {
  const seen = new Map<string, number>();
  return issues.map((issue) => {
    const base = [
      issue.severity,
      issue.nodeId ?? '',
      issue.message,
      JSON.stringify(issue.values ?? {}),
    ].join('|');
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { key: `${base}#${n}`, issue };
  });
}

function IssueRow({
  issue,
  onPick,
}: Readonly<{ issue: GraphIssue; onPick: (nodeId: string) => void }>) {
  const t = useT();
  const { nodeId } = issue;
  const icon =
    issue.severity === 'error' ? (
      <ErrorOutlinedIcon fontSize="small" color="error" />
    ) : (
      <WarningAmberIcon fontSize="small" color="warning" />
    );
  const content = (
    <>
      <ListItemIcon sx={{ minWidth: 32 }}>{icon}</ListItemIcon>
      <ListItemText primary={t(issue.message, issue.values)} secondary={nodeId} />
    </>
  );
  if (nodeId) {
    return <ListItemButton onClick={() => onPick(nodeId)}>{content}</ListItemButton>;
  }
  return <ListItem>{content}</ListItem>;
}

/** Live `validateGraph` result: errors block Publish, warnings do not. */
export function ValidationPanel({ issues, onPick }: Readonly<ValidationPanelProps>) {
  const t = useT();
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;

  if (issues.length === 0) {
    return (
      <Flex alignItems="center" gap={1} sx={{ p: 2 }} role="status">
        <CheckCircleOutlinedIcon color="success" aria-hidden />
        <Text size="sm">{t('No problems found. Ready to publish.')}</Text>
      </Flex>
    );
  }

  return (
    <Box component="section" aria-label={t('Problems')}>
      <Text size="sm" weight="semibold" component="p" sx={{ px: 2, pt: 1.5 }} role="status">
        {t('{errors} errors, {warnings} warnings', { errors, warnings })}
      </Text>
      <List dense>
        {keyed(issues).map(({ key, issue }) => (
          <IssueRow key={key} issue={issue} onPick={onPick} />
        ))}
      </List>
    </Box>
  );
}
