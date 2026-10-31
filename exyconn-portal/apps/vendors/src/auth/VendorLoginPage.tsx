import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Heading, Text } from '@exyconn/shell/components/ui';
import { safeNext } from '@exyconn/shell/utils/redirect';
import { EmailCodeSignInForm } from '@exyconn/shell/components/form/email-code-sign-in';
import {
  useRequestVendorPortalCodeMutation,
  useVerifyVendorPortalCodeMutation,
} from '@exyconn/shell/graphql/generated';
import { LoginShell } from '@exyconn/login';
import { vendorPass } from './vendorPass';
import { PATHS } from '../paths';

/** The vendor portal's front door: the work email a buyer gave access to, and a one-time code. */
export function VendorLoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [requestCode] = useRequestVendorPortalCodeMutation();
  const [verifyCode] = useVerifyVendorPortalCodeMutation();
  const requested = safeNext(params.get('next'));
  const next = requested === '/' ? PATHS.orders : requested;

  if (vendorPass.has()) return <Navigate to={next} replace />;

  const signedIn = (pass: string) => {
    vendorPass.store(pass);
    navigate(next, { replace: true });
  };

  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 1 }}>
            {t('Sign in to the vendor portal')}
          </Heading>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('See your purchase orders, send invoices against them and follow payments.')}
          </Text>
          <EmailCodeSignInForm
            accentColor={page.accentColor}
            requestCode={async (email) => {
              await requestCode({ variables: { email } });
            }}
            verifyCode={async (email, code) => {
              const { data } = await verifyCode({ variables: { email, code } });
              return data?.verifyVendorPortalCode.token;
            }}
            onSignedIn={signedIn}
          />
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('No access yet? Ask your buyer to add your email.')}
          </Text>
        </>
      )}
    </LoginShell>
  );
}
