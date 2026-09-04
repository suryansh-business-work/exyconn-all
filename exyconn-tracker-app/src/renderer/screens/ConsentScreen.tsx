import { useState, type ReactElement } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@exyconn/ui';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import type { Branding, ConsentPolicy, TrackerSettings } from '@shared/types';
import { WEBCAM_DISCLOSURE } from '@shared/config';
import BrandMark from '../components/BrandMark';
import ConsentBody from '../components/ConsentBody';
import Surface from '../components/Surface';
import ScreenLayout from '../components/ScreenLayout';
import { run } from '../run';

interface Props {
  branding: Branding | null;
  settings: TrackerSettings | null;
  /** The Legal policy behind this disclosure, when the workspace has chosen one. */
  policy: ConsentPolicy | null;
}

/**
 * Consent gate. The disclosure itself is authored in the portal — as a versioned Legal policy
 * when the workspace has chosen one, otherwise as the tracker's own consent text — and
 * rendered verbatim: this app never paraphrases what it records. Tracking only begins once
 * the person explicitly agrees, so there is nothing to nudge here.
 *
 * A policy that requires acknowledgement is SIGNED, not just accepted: the employee types
 * their name, and the signature goes into Legal's ledger against the exact version they were
 * shown. Re-publishing changed wording raises the version and brings them back here, which is
 * the whole point — an agreement to superseded wording is not an agreement to this one.
 *
 * The one thing the app states on its own account is the webcam, when it is switched on: the
 * disclosure is the workspace's to write, and being photographed is not something anyone
 * should be able to leave out of it.
 */
export default function ConsentScreen({
  branding,
  settings,
  policy,
}: Readonly<Props>): ReactElement {
  const [busy, setBusy] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const body = policy?.body ?? settings?.consentText ?? '';
  const hasDisclosure = body.trim() !== '';
  const mustSign = policy?.requiresAcknowledgement === true;
  const canAgree = hasDisclosure && (!mustSign || signedName.trim() !== '');
  const webcamEnabled = settings?.webcamEnabled ?? false;

  async function accept(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await window.tracker.acceptConsent(signedName.trim());
    } catch (cause: unknown) {
      console.error('Failed to record consent', cause);
      setError(cause instanceof Error ? cause.message : 'Could not record your agreement.');
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
        <Typography variant="h5">{policy?.title ?? 'Before you start'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {policy
            ? `Version ${policy.version} of your workspace's policy. Nothing is captured until you sign and press Start.`
            : 'Read what this app records while tracking is on. Nothing is captured until you agree and press Start.'}
        </Typography>

        {hasDisclosure ? (
          <ConsentBody html={body} />
        ) : (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: '4px' }}>
            Your workspace has not published a monitoring disclosure yet. You cannot agree to
            something that has not been disclosed — ask your administrator to publish it in the
            portal.
          </Alert>
        )}

        {webcamEnabled ? (
          <Alert
            severity="warning"
            variant="outlined"
            icon={<PhotoCameraOutlined fontSize="small" />}
            sx={{ borderRadius: '4px', mt: 2 }}
          >
            {WEBCAM_DISCLOSURE}
          </Alert>
        ) : null}

        {mustSign && (
          <TextField
            fullWidth
            size="small"
            label="Type your full name to sign"
            value={signedName}
            onChange={(event) => setSignedName(event.target.value)}
            helperText="Recorded against this version of the policy, and visible to Legal and HR."
            sx={{ mt: 2 }}
          />
        )}

        {error !== null && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px', mt: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CheckCircleOutline />}
            disabled={busy || !canAgree}
            onClick={() => run(accept)}
          >
            {mustSign ? 'Sign and agree' : 'I understand and agree'}
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
