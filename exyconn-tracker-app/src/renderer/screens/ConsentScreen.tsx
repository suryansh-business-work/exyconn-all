import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import type { Branding, TrackerSettings } from '@shared/types';
import BrandMark from '../components/BrandMark';
import ConsentBody from '../components/ConsentBody';
import Surface from '../components/Surface';
import ScreenLayout from '../components/ScreenLayout';
import { run } from '../run';

interface Props {
  branding: Branding | null;
  settings: TrackerSettings | null;
}

/**
 * Consent gate. The disclosure itself is authored in the portal (settings.consentText)
 * and rendered verbatim — this app never paraphrases what it records. Tracking only
 * begins once the person explicitly agrees, so there is nothing to nudge here.
 */
export default function ConsentScreen({ branding, settings }: Readonly<Props>): JSX.Element {
  const [busy, setBusy] = useState(false);
  const consentText = settings?.consentText ?? '';
  const hasDisclosure = consentText.trim() !== '';

  async function accept(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.acceptConsent();
    } catch (cause: unknown) {
      console.error('Failed to record consent', cause);
      setBusy(false);
    }
  }

  async function decline(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.logout();
    } catch (cause: unknown) {
      console.error('Failed to sign out', cause);
      setBusy(false);
    }
  }

  return (
    <ScreenLayout maxWidth={560}>
      <Stack alignItems="center" sx={{ mb: 2.5 }}>
        <BrandMark branding={branding} height={36} />
      </Stack>

      <Surface sx={{ p: 3 }}>
        <Typography variant="h5">Before you start</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Read what this app records while tracking is on. Nothing is captured until you agree and
          press Start.
        </Typography>

        {hasDisclosure ? (
          <ConsentBody html={consentText} />
        ) : (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: '4px' }}>
            Your workspace has not published a monitoring disclosure yet. You cannot agree to
            something that has not been disclosed — ask your administrator to publish it in the
            portal.
          </Alert>
        )}

        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CheckCircleOutline />}
            disabled={busy || !hasDisclosure}
            onClick={() => run(accept)}
          >
            I understand and agree
          </Button>
          <Button
            variant="text"
            color="inherit"
            fullWidth
            disabled={busy}
            onClick={() => run(decline)}
          >
            Not now
          </Button>
        </Stack>
      </Surface>
    </ScreenLayout>
  );
}
