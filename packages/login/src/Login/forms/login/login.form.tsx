import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Flex,
  IconButton,
  InputAdornment,
  Link,
  Text,
} from '@exyconn/shell/components/ui';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useLoginMutation } from '@exyconn/shell/graphql/generated';
import { useAuth, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Minimum 6 characters'),
});
type Values = z.infer<typeof schema>;

const pillSx = { '& .MuiOutlinedInput-root': { borderRadius: '999px' } };

/** React Hook Form + Zod login form styled to the Lumin-style frosted card. */
export function LoginForm() {
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
        <Flex direction="column" spacing={1.75}>
          {error && <Alert severity="error">{error}</Alert>}
          <RhfTextField
            name="email"
            placeholder="e-mail address"
            autoComplete="email"
            sx={pillSx}
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
            sx={pillSx}
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
          <Link
            component="button"
            type="button"
            variant="body2"
            sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
            onClick={() =>
              notify('Please contact your administrator to reset your password.', 'info')
            }
          >
            Forgot password?
          </Link>

          <Flex direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Text size="caption" color="text.secondary">
              Authorized personnel only. Sign in with your Exyconn credentials to access the
              operations portal.
            </Text>
            <IconButton
              type="submit"
              disabled={methods.formState.isSubmitting}
              aria-label="Log in"
              sx={{
                flexShrink: 0,
                width: 56,
                height: 56,
                bgcolor: '#0e1116',
                color: '#fff',
                '&:hover': { bgcolor: '#000' },
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Flex>
        </Flex>
        <Box sx={{ display: 'none' }} data-testid="login-form-ready" />
      </form>
    </FormProvider>
  );
}
