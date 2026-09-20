import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Flex,
  IconButton,
  InputAdornment,
  Link,
  readableInk,
} from '@exyconn/shell/components/ui';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useLoginMutation } from '@exyconn/shell/graphql/generated';
import { useAuth, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';
import { AdminRecovery } from './AdminRecovery';
import { MfaChallengeForm } from '../mfa';
import { ForgotPasswordDialog } from '../forgot-password';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Minimum 6 characters'),
});
type Values = z.infer<typeof schema>;

interface LoginFormProps {
  /** Portal accent from branding — tints the submit button so each portal reads as its own. */
  accentColor: string;
}

/** React Hook Form + Zod login form. Compact: two fields and one full-width action. */
export function LoginForm({ accentColor }: Readonly<LoginFormProps>) {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const [login] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  /** Set when the password was right and an authenticator code is still owed. */
  const [challenge, setChallenge] = useState('');
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const { data } = await login({ variables: values });
      const result = data?.login;
      if (result?.mfaRequired) {
        setChallenge(result.mfaChallenge);
        return;
      }
      if (result?.token && result.user) {
        signIn(result.token, result.user as AuthUser);
        // Return the user to the page they were trying to reach before the gate.
        navigate(safeNext(params.get('next')), { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Login failed'));
    }
  };

  if (challenge) {
    return (
      <MfaChallengeForm
        challenge={challenge}
        accentColor={accentColor}
        onStartOver={() => setChallenge('')}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <RhfTextField
            name="email"
            placeholder={t('e-mail address')}
            autoComplete="email"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <RhfTextField
            name="password"
            placeholder={t('password')}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label={t('toggle password')}
                      onClick={() => setShow((s) => !s)}
                    >
                      {show ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={methods.formState.isSubmitting}
            sx={{
              bgcolor: accentColor,
              // The label's ink is picked by contrast with the accent, not assumed to be white.
              color: readableInk(accentColor),
              py: 1,
              '&:hover': { bgcolor: accentColor, opacity: 0.9 },
            }}
          >
            {t('Log in')}
          </Button>

          <Flex direction="column" alignItems="flex-start" spacing={0.5}>
            <Link
              component="button"
              type="button"
              variant="caption"
              sx={{ color: 'text.secondary' }}
              onClick={() => setForgotOpen(true)}
            >
              {t('Forgot password?')}
            </Link>
            <AdminRecovery />
          </Flex>
        </Flex>
        <Box sx={{ display: 'none' }} data-testid="login-form-ready" />
      </form>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </FormProvider>
  );
}
