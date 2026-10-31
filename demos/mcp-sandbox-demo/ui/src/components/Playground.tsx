import { useT } from '@exyconn/i18n';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {
  Alert,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Text,
  TextField,
  Typography,
} from '@exyconn/shell/components/ui';
import { ToolCallForm } from '../forms/tool-call';
import {
  exampleArgs,
  usePlayground,
  type Playground as PlaygroundState,
} from '../playground/usePlayground';

const COLUMNS = {
  display: 'grid',
  gap: 3,
  alignItems: 'start',
  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 2fr)' },
} as const;

/** The tools, with a filter; the picked one is marked. */
function ToolPicker({
  playground,
  total,
}: Readonly<{ playground: PlaygroundState; total: number }>) {
  const t = useT();
  return (
    <Stack spacing={1}>
      <TextField
        label={t('Filter tools')}
        size="small"
        value={playground.filter}
        onChange={(event) => playground.setFilter(event.target.value)}
      />
      <Text size="sm" color="text.secondary">
        {t('{shown} of {total} read-only tools', {
          shown: playground.shown.length,
          total,
        })}
      </Text>
      <Paper variant="outlined" sx={{ maxHeight: 420, overflowY: 'auto' }}>
        <List dense aria-label={t('Tools')}>
          {playground.shown.map((tool) => (
            <ListItemButton
              key={tool.name}
              selected={tool.name === playground.selected?.name}
              onClick={() => playground.select(tool.name)}
            >
              <ListItemText primary={tool.name} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}

/** The picked tool: what it does, its arguments and its answer. */
function ToolRunner({ playground }: Readonly<{ playground: PlaygroundState }>) {
  const t = useT();
  const tool = playground.selected;
  if (!tool) {
    return <Text color="text.secondary">{t('Pick a tool to see what it does and run it.')}</Text>;
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h3">
        {tool.name}
      </Typography>
      {tool.description && <Text color="text.secondary">{tool.description}</Text>}
      <ToolCallForm
        key={tool.name}
        initialArgs={exampleArgs(tool)}
        busy={playground.running}
        onRun={(args) => playground.run(tool.name, args)}
      />
      {playground.answer && (
        <Box
          component="pre"
          role="region"
          tabIndex={0}
          aria-label={t('Answer')}
          sx={{
            m: 0,
            p: 2,
            maxHeight: 480,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 'body2.fontSize',
            whiteSpace: 'pre-wrap',
            bgcolor: 'action.hover',
            color: playground.answer.isError ? 'error.main' : 'text.primary',
          }}
        >
          {playground.answer.text}
        </Box>
      )}
    </Stack>
  );
}

interface PlaygroundProps {
  endpointUrl: string;
  /** The visitor's sandbox token; null until they take one on this page. */
  token: string | null;
}

/** Lists the tools the token may call and runs them, right in the browser. */
export function Playground({ endpointUrl, token }: Readonly<PlaygroundProps>) {
  const t = useT();
  if (!token) {
    return <Alert severity="info">{t('Take a token above to try the tools here.')}</Alert>;
  }
  return <TokenPlayground key={token} endpointUrl={endpointUrl} token={token} />;
}

/** The playground for one token: a new token starts it afresh. */
function TokenPlayground({ endpointUrl, token }: Readonly<{ endpointUrl: string; token: string }>) {
  const t = useT();
  const playground = usePlayground(endpointUrl, token);
  if (!playground.tools) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        {playground.error && <Alert severity="error">{playground.error}</Alert>}
        <Button
          variant="contained"
          startIcon={<ListAltIcon />}
          disabled={playground.loading}
          onClick={() => playground.load()}
        >
          {t('List the tools')}
        </Button>
      </Stack>
    );
  }
  return (
    <Box sx={COLUMNS}>
      <ToolPicker playground={playground} total={playground.tools.length} />
      <ToolRunner playground={playground} />
    </Box>
  );
}
