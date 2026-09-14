import { useEffect, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  borderWidth,
  Box,
  Button,
  color,
  Dialog,
  DialogContent,
  Flex,
  radius,
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
  const t = useT();
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
  const usesFragments =
    template.fragments.length > 0
      ? t(' · uses {fragments}', { fragments: template.fragments.join(', ') })
      : '';

  const render = () => {
    preview({ variables: { key: template.key, variables } }).catch(() => undefined);
  };

  const send = async () => {
    try {
      await sendTest({ variables: { key: template.key, to, variables } });
      notify('Test sent to {to}', 'success', { to });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'The test email could not be sent', 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth aria-label={t('Preview email template')}>
      <DialogContent>
        <Text size="lg" weight="bold" component="div">
          {template.name}
        </Text>
        <Text size="caption" color="text.secondary" component="div" sx={{ mb: 2 }}>
          {template.key}
          {usesFragments}
        </Text>

        {template.variables.length === 0 ? (
          <Text size="sm" color="text.secondary">
            {t('This template has no placeholders.')}
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
                sx={{ minWidth: { sm: 200 }, width: { xs: '100%', sm: 'auto' }, mb: 1 }}
              />
            ))}
          </Flex>
        )}

        <Flex
          direction="row"
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2, flexWrap: 'wrap' }}
        >
          <Button variant="contained" onClick={render} disabled={loading}>
            {loading ? t('Rendering…') : t('Preview')}
          </Button>
          <TextField
            size="small"
            label={t('Send a test to')}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            sx={{ minWidth: { sm: 240 }, width: { xs: '100%', sm: 'auto' } }}
          />
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            disabled={sending || to.trim() === ''}
            onClick={() => void send()}
          >
            {t('Send test')}
          </Button>
        </Flex>

        {error ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: `${radius.sm}px`, mb: 2 }}>
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
              title={t('Email preview')}
              srcDoc={data.previewEmailTemplate.html}
              sx={(theme) => ({
                width: '100%',
                height: 480,
                border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
                borderRadius: `${radius.sm}px`,
                backgroundColor: color.white,
              })}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
