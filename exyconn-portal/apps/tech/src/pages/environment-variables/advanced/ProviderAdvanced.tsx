import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import {
  ProviderBillingNeed,
  useTechProviderProfileQuery,
  type TechProviderProfileFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { ProviderLinks } from './ProviderLinks';
import { ProviderLogins } from './ProviderLogins';

const BILLING_KEYS_PATH = '/tech/environment-variables/billing-keys';

/** Whether billing needs another key, said plainly; a way to add it when it does. */
function BillingNotice({
  billing,
}: Readonly<{ billing: TechProviderProfileFieldsFragment['billing'] }>) {
  const t = useT();
  const navigate = useNavigate();
  const required = billing.need === ProviderBillingNeed.Required;
  return (
    <Alert
      severity={required ? 'warning' : 'info'}
      action={
        required ? (
          <Button size="small" onClick={() => navigate(BILLING_KEYS_PATH)}>
            {t('Billing keys')}
          </Button>
        ) : undefined
      }
    >
      {t(billing.message)}
    </Alert>
  );
}

/** "How to create the keys", as numbered steps. */
function KeySteps({ steps }: Readonly<{ steps: TechProviderProfileFieldsFragment['steps'] }>) {
  const t = useT();
  return (
    <Box>
      <Text weight="medium">{t('How to create the keys')}</Text>
      <Box component="ol" sx={{ pl: 3, my: 1 }}>
        {steps.map((step) => (
          <Box component="li" key={step.description} sx={{ mb: 0.5 }}>
            <Text size="sm">{t(step.description)}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Environment Variables > a provider > Advanced: whether billing needs its own key, how to create
 * the keys step by step, the accounts they were made under, and the provider's consoles.
 */
export function ProviderAdvanced({ provider }: Readonly<{ provider: string }>) {
  const t = useT();
  const { data, error } = useTechProviderProfileQuery({ variables: { provider } });
  const profile = data?.techProviderProfile;
  if (error) {
    return <Text color="error">{error.message}</Text>;
  }
  if (!profile) {
    return null;
  }
  return (
    <Accordion sx={{ mt: 3 }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${provider}-advanced`}>
        <Text weight="medium">{t('Advanced: billing, setup steps, logins and links')}</Text>
      </AccordionSummary>
      <AccordionDetails id={`${provider}-advanced`}>
        <Flex direction="column" spacing={3}>
          <BillingNotice billing={profile.billing} />
          <KeySteps steps={profile.steps} />
          <ProviderLogins provider={provider} logins={profile.logins} />
          <ProviderLinks provider={provider} links={profile.links} />
        </Flex>
      </AccordionDetails>
    </Accordion>
  );
}
