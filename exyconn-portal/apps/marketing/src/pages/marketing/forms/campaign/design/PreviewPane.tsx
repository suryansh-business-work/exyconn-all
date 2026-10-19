import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import {
  Alert,
  Box,
  Chip,
  Flex,
  LinearProgress,
  Text,
  ToggleButton,
  TextField,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { CodeEditor } from '@exyconn/code-editor';
import type { CampaignPreviewState } from './useCampaignPreview';

type Device = 'desktop' | 'mobile';
type View = 'email' | 'html' | 'text';

const WIDTH: Readonly<Record<Device, number>> = { desktop: 680, mobile: 375 };
const FRAME_HEIGHT = 640;

interface PreviewPaneProps {
  state: CampaignPreviewState;
}

/** Problems the preview found: compile errors and variables with nothing to show. */
function PreviewProblems({ state }: Readonly<PreviewPaneProps>) {
  const t = useT();
  const preview = state.preview;
  return (
    <>
      {state.error && <Alert severity="error">{t(state.error)}</Alert>}
      {preview?.issues.map((issue) => (
        <Alert key={`${issue.line}-${issue.message}`} severity="error">
          {t('Line {line}: {message}', { line: issue.line, message: issue.message })}
        </Alert>
      ))}
      {preview && preview.missingVariables.length > 0 && (
        <Alert severity="warning">
          {t('Empty for this recipient, with no fallback: {keys}. Add a fallback like {example}.', {
            keys: preview.missingVariables.join(', '),
            example: '{{contact.firstName|there}}',
          })}
        </Alert>
      )}
    </>
  );
}

/** The selected view: the rendered email in a sandbox, or its source. */
function PreviewBody({
  state,
  device,
  view,
}: Readonly<PreviewPaneProps & { device: Device; view: View }>) {
  const t = useT();
  const preview = state.preview;
  if (!preview?.html) {
    return (
      <Text size="sm" color="text.secondary" sx={{ p: 2 }}>
        {t(state.updating ? 'Building the preview…' : 'Nothing to preview yet.')}
      </Text>
    );
  }
  if (view === 'email') {
    return (
      <Box
        component="iframe"
        title={t('Email preview')}
        // No scripts, no same-origin access, no forms, no navigation: the email is shown, never run.
        sandbox=""
        srcDoc={preview.html}
        sx={{
          width: WIDTH[device],
          maxWidth: '100%',
          height: FRAME_HEIGHT,
          border: 0,
          bgcolor: 'common.white',
          display: 'block',
          mx: 'auto',
        }}
      />
    );
  }
  if (view === 'html') {
    return (
      <CodeEditor
        value={preview.html}
        onChange={ignoreEdit}
        language="html"
        label={t('HTML output')}
        height={FRAME_HEIGHT}
        readOnly
      />
    );
  }
  return (
    <TextField
      label={t('Plain-text version')}
      value={preview.text}
      multiline
      fullWidth
      minRows={12}
      maxRows={30}
      slotProps={{ htmlInput: { readOnly: true } }}
      sx={{ p: 1 }}
    />
  );
}

/** The HTML view is read-only; Monaco still asks for a change handler. */
function ignoreEdit(): void {
  // Nothing to store: the output is regenerated from the MJML on every change.
}

/** The live preview: inbox line, the email at desktop or phone width, and its problems. */
export function PreviewPane({ state }: Readonly<PreviewPaneProps>) {
  const t = useT();
  const [device, setDevice] = useState<Device>('desktop');
  const [view, setView] = useState<View>('email');
  const preview = state.preview;
  return (
    <Flex direction="column" spacing={1} aria-busy={state.updating}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={device}
          aria-label={t('Preview width')}
          onChange={(_e, next: Device | null) => next && setDevice(next)}
        >
          <ToggleButton value="desktop" aria-label={t('Desktop')}>
            <ComputerIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="mobile" aria-label={t('Mobile')}>
            <PhoneIphoneIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          aria-label={t('Preview view')}
          onChange={(_e, next: View | null) => next && setView(next)}
        >
          <ToggleButton value="email">{t('Email')}</ToggleButton>
          <ToggleButton value="html">{t('HTML')}</ToggleButton>
          <ToggleButton value="text">{t('Plain text')}</ToggleButton>
        </ToggleButtonGroup>
      </Flex>
      {state.updating && <LinearProgress aria-label={t('Updating preview…')} />}
      {preview && (
        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            opacity: state.updating ? 0.6 : 1,
          }}
        >
          <Flex direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={t('To: {name}', { name: preview.recipient.name || preview.recipient.email })}
            />
            {preview.recipient.kind === 'SAMPLE' && (
              <Chip size="small" variant="outlined" label={t('Sample data')} />
            )}
          </Flex>
          <Text size="sm" weight="semibold" sx={{ display: 'block', mt: 1 }}>
            {preview.subject || t('(no subject)')}
          </Text>
          <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
            {preview.preheader || t('(no preview text)')}
          </Text>
        </Box>
      )}
      <PreviewProblems state={state} />
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'action.hover',
          opacity: state.updating ? 0.6 : 1,
          overflow: 'hidden',
        }}
      >
        <PreviewBody state={state} device={device} view={view} />
      </Box>
    </Flex>
  );
}
