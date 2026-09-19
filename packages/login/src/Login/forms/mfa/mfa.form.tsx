import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Alert,
  Button,
  Flex,
  InputAdornment,
  Link,
  Typography,
  readableInk,
} from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useVerifyMfaMutation } from '@exyconn/shell/graphql/generated';
import { useAuth, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';
import type { MfaChallengeValues } from './mfa.types';

/**
 * Both shapes the field takes: six digits from the app, or a recovery code from the printout.
 *
 * One field rather than two, because the person holding a recovery code is already having a
 * bad day and should not also have to find the right box to type it in.
 */
const schema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Enter the six-digit code from your authenticator app')
    .max(20, 'That is longer than any code we issue'),
});

interface MfaChallengeFormProps {
  /** The five-minute token the password step returned. */
  challenge: string;
  accentColor: string;
  /** Takes the person back to the password step, e.g. when the challenge has expired. */
  onStartOver: () => void;
}

/** The second step of a sign-in, for an account with two-factor authentication on. */
export function MfaChallengeForm({
  challenge,
  accentColor,
  onStartOver,
}: Readonly<MfaChallengeFormProps>) {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const [verify] = useVerifyMfaMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<MfaChallengeValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (values: MfaChallengeValues) => {
    setError(null);
    try {
      const { data } = await verify({ variables: { challenge, code: values.code } });
      const result = data?.verifyMfa;
      if (result?.token && result.user) {
        signIn(result.token, result.user as AuthUser);
        navigate(safeNext(params.get('next')), { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('That code was not accepted'));
      methods.reset({ code: '' });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('Enter the code from your authenticator app, or one of your recovery codes.')}
          </Typography>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <RhfTextField
            name="code"
            placeholder={t('123 456')}
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ShieldOutlinedIcon fontSize="small" />
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
              color: readableInk(accentColor),
              py: 1,
              '&:hover': { bgcolor: accentColor, opacity: 0.9 },
            }}
          >
            {t('Verify')}
          </Button>
          <Link
            component="button"
            type="button"
            variant="caption"
            sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}
            onClick={onStartOver}
          >
            {t('Start again')}
          </Link>
        </Flex>
      </form>
    </FormProvider>
  );
}
