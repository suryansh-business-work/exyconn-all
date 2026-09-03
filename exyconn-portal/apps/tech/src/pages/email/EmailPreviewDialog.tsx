import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Flex,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import SendIcon from '@mui/icons-material/Send';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  usePreviewEmailTemplateLazyQuery,
  useSendTestEmailTemplateMutation,
} from '@exyconn/shell/graphql/generated';
import type { PagedTemplateRow } from './email-grids';

interface Props {
  template: PagedTemplateRow | null;
  onClose: () => void;
}

/** A sample value, so the preview shows something rather than the word "undefined". */
function sampleFor(name: string): string {
  return `{${name}}`;
}

/**
 * Preview a template, and send it to yourself.
 *
 * Both go through the very code that sends the real thing — a preview rendered by a second,
 * simpler path is a preview that lies, and a "test" that skips the transport tests nothing.
 * The fields offered are read out of the template's own markup, so the form can never ask
 * for a placeholder the template stopped using.
 */
export function EmailPreviewDialog({ template, onClose }: Readonly<Props>) {
  const notify = useNotify();
  const [values, setValues] = useState<Record<string, string>>({});
  const [to, setTo] = useState('');
  const [preview, { data, loading, error }] = usePreviewEmailTemplateLazyQuery({
    fetchPolicy: 'no-cache',
  });
  const [sendTest, { loading: sending }] = useSendTestEmailTemplateMutation();

  // Reset to this template's own placeholders whenever the dialog opens on a new one.
  useEffect(() => {
    if (template === null) return;
    setValues(Object.fromEntries(template.variables.map((name) => [name, sampleFor(name)])));
  }, [template]);

  if (template === null) {
    return null;
  }

  const variables = Object.entries(values).map(([name, value]) => ({ name, value }));

  const render = () => {
    preview({ variables: { key: template.key, variables } }).catch(() => undefined);
  };

  const send = async () => {
    try {
      await sendTest({ variables: { key: template.key, to, variables } });
      notify(`Test sent to ${to}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'The test email could not be sent', 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth aria-label="Preview email template">
      <DialogContent>
        <Text size="lg" weight="bold" component="div">
          {template.name}
        </Text>
        <Text size="caption" color="text.secondary" component="div" sx={{ mb: 2 }}>
          {template.key}
          {template.fragments.length > 0 ? ` · uses ${template.fragments.join(', ')}` : ''}
        </Text>

        {template.variables.length === 0 ? (
          <Text size="sm" color="text.secondary">
            This template has no placeholders.
          </Text>
        ) : (
          <Flex direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1.5 }}>
            {template.variables.map((name) => (
              <TextField
                key={name}
                size="small"
                label={name}
                value={values[name] ?? ''}
                onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
                sx={{ minWidth: 200, mb: 1 }}
              />
            ))}
          </Flex>
        )}

        <Flex direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button variant="contained" onClick={render} disabled={loading}>
            {loading ? 'Rendering…' : 'Preview'}
          </Button>
          <TextField
            size="small"
            label="Send a test to"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            disabled={sending || to.trim() === ''}
            onClick={() => void send()}
          >
            Send test
          </Button>
        </Flex>

        {error ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px', mb: 2 }}>
            {error.message}
          </Alert>
        ) : null}

        {data?.previewEmailTemplate ? (
          <Box>
            <Text size="label" component="div" sx={{ mb: 0.5 }}>
              {data.previewEmailTemplate.subject}
            </Text>
            {/* An iframe, not innerHTML: the email's own CSS must not leak into the portal,
                and the portal's must not flatter the email into looking better than it is. */}
            <Box
              component="iframe"
              title="Email preview"
              srcDoc={data.previewEmailTemplate.html}
              sx={(theme) => ({
                width: '100%',
                height: 480,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                backgroundColor: '#ffffff',
              })}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
