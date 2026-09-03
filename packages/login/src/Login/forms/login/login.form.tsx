import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Flex,
  IconButton,
  InputAdornment,
  Link,
} from '@exyconn/shell/components/ui';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useLoginMutation } from '@exyconn/shell/graphql/generated';
import { useAuth, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';
import { AdminRecovery } from './AdminRecovery';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Minimum 6 characters'),
});
type Values = z.infer<typeof schema>;

interface LoginFormProps {
  /** Portal accent from branding — tints the submit button so each portal reads as its own. */
  accentColor: string;
}

/** React Hook Form + Zod login form. Compact: two fields and one full-width action. */
export function LoginForm({ accentColor }: Readonly<LoginFormProps>) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const notify = useNotify();
  const { signIn } = useAuth();
  const [login] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const { data } = await login({ variables: values });
      if (data?.login) {
        signIn(data.login.token, data.login.user as AuthUser);
        // Return the user to the page they were trying to reach before the gate.
        navigate(safeNext(params.get('next')), { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField
            name="email"
            placeholder="e-mail address"
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <RhfTextField
            name="password"
            placeholder="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            InputProps={{
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
                    aria-label="toggle password"
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
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={methods.formState.isSubmitting}
            sx={{ bgcolor: accentColor, py: 1, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}
          >
            Log in
          </Button>

          <Flex direction="column" alignItems="flex-start" spacing={0.25}>
            <Link
              component="button"
              type="button"
              variant="caption"
              sx={{ color: 'text.secondary' }}
              onClick={() =>
                notify('Please contact your administrator to reset your password.', 'info')
              }
            >
              Forgot password?
            </Link>
            <AdminRecovery />
          </Flex>
        </Flex>
        <Box sx={{ display: 'none' }} data-testid="login-form-ready" />
      </form>
    </FormProvider>
  );
}
