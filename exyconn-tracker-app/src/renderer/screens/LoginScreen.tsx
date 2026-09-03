import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Branding, ThemeMode } from '@shared/types';
import AppFooter from '../components/AppFooter';
import BrandMark from '../components/BrandMark';
import Surface from '../components/Surface';
import PasswordField from '../components/PasswordField';
import ScreenLayout from '../components/ScreenLayout';
import ThemeToggleButton from '../components/ThemeToggleButton';
import TitleBar from '../components/TitleBar';

interface Props {
  branding: Branding | null;
  rememberMe: boolean;
  /** Set when the app signed the employee out itself — they are owed the reason. */
  signedOutReason: string | null;
  /** Light/dark is switchable before sign-in too — the toggle sits in the title bar. */
  themeMode: ThemeMode;
}

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/** Sign-in screen. Uses portal credentials; the main process validates them. */
export default function LoginScreen({
  branding,
  rememberMe,
  signedOutReason,
  themeMode,
}: Readonly<Props>): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(rememberMe);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailMissing = submitted && email.trim() === '';
  const passwordMissing = submitted && password === '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitted(true);
    if (email.trim() === '' || password === '') {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await window.tracker.login(email.trim(), password, remember);
      if (!result.ok) {
        setError(result.error ?? 'Sign in failed. Please check your details and try again.');
        setLoading(false);
      }
      // On success the main process pushes a new state and this screen unmounts.
    } catch (cause: unknown) {
      console.error('Login request failed', cause);
      setError(GENERIC_ERROR);
      setLoading(false);
    }
  }

  return (
    <>
      {/* The window is frameless and this screen has no header of its own, so without this
          bar the login window could not be moved, minimised or closed at all. */}
      <TitleBar title="Sign in" actions={<ThemeToggleButton mode={themeMode} />} />

      <ScreenLayout maxWidth={420}>
        <Stack alignItems="center" sx={{ mb: 2 }}>
          <BrandMark branding={branding} height={44} />
        </Stack>

        <Surface sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use your Exyconn portal email and password.
          </Typography>

          {signedOutReason !== null ? (
            <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: '4px' }}>
              {signedOutReason}
            </Alert>
          ) : null}

          <Stack component="form" noValidate onSubmit={handleSubmit} spacing={1.75}>
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              fullWidth
              value={email}
              disabled={loading}
              error={emailMissing}
              helperText={emailMissing ? 'Enter your email.' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />

            <PasswordField
              value={password}
              disabled={loading}
              error={passwordMissing}
              helperText={passwordMissing ? 'Enter your password.' : undefined}
              onChange={setPassword}
            />

            <FormControlLabel
              sx={{ my: -0.5 }}
              control={
                <Checkbox
                  checked={remember}
                  disabled={loading}
                  onChange={(event) => setRemember(event.target.checked)}
                />
              }
              label={<Typography variant="body2">Remember me on this computer</Typography>}
            />

            {error !== null ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px' }}>
                {error}
              </Alert>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Surface>
      </ScreenLayout>

      <AppFooter branding={branding} />
    </>
  );
}
