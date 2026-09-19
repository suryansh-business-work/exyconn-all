import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex, Heading, LinearProgress, Switch, Text } from '@/components/ui';
import { readingPanel } from '@/components/glass/glass';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import {
  useMyNotificationPreferencesQuery,
  useSetMyNotificationPreferenceMutation,
  type MyNotificationPreferencesQuery,
  type NotificationKind,
} from '@/graphql/generated';

type Preference = MyNotificationPreferencesQuery['myNotificationPreferences'][number];

/**
 * What each kind is called on screen.
 *
 * Written out rather than prettified from the enum: "SOCIAL_LIKE" becomes "Likes on your
 * posts", which is what somebody deciding whether to switch it off actually wants to read.
 */
const LABELS: Record<string, string> = {
  ANNOUNCEMENT: 'Announcements',
  LEAVE: 'Leave decisions',
  PAYROLL: 'Payslips and payroll',
  GOAL: 'Goals',
  PERFORMANCE: 'Appraisals',
  REQUEST: 'Requests you raised or decide',
  TRAINING: 'Training',
  ONBOARDING: 'Onboarding tasks',
  SOCIAL_LIKE: 'Likes on your posts',
  SOCIAL_COMMENT: 'Comments on your posts',
  SOCIAL_SHARE: 'Shares of your posts',
  SUPPORT: 'Support tickets',
  IT: 'IT requests and assets',
  FINANCE: 'Invoices and money',
  CRM: 'Leads, deals and follow-ups',
  PROJECT: 'Project tickets and bugs',
  LEGAL: 'Contracts and policies',
  COMPLIANCE: 'Risks, findings and reviews',
  GENERAL: 'Everything else',
};

interface PreferenceRowProps {
  preference: Preference;
  saving: boolean;
  onChange: (preference: Preference, channels: { inPortal: boolean; email: boolean }) => void;
}

function PreferenceRow({ preference, saving, onChange }: Readonly<PreferenceRowProps>) {
  const t = useT();
  const label = t(LABELS[preference.kind] ?? preference.kind);
  return (
    <Flex
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}
    >
      <Text size="sm">{label}</Text>
      <Flex direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Switch
          size="small"
          checked={preference.inPortal}
          disabled={saving}
          slotProps={{ input: { 'aria-label': t('{label} in the portal', { label }) } }}
          onChange={(event) =>
            onChange(preference, { inPortal: event.target.checked, email: preference.email })
          }
        />
        <Switch
          size="small"
          checked={preference.email}
          disabled={saving}
          slotProps={{ input: { 'aria-label': t('{label} by email', { label }) } }}
          onChange={(event) =>
            onChange(preference, { inPortal: preference.inPortal, email: event.target.checked })
          }
        />
      </Flex>
    </Flex>
  );
}

/**
 * Account settings: which notifications reach this person, and where.
 *
 * The kinds were always separate so this screen could exist; nothing read them until the
 * reminder sweep started chasing dates, at which point "turn that one down" became the
 * difference between a useful bell and one people stop opening.
 */
export function NotificationPreferencesPanel() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, error } = useMyNotificationPreferencesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [save, { loading: saving }] = useSetMyNotificationPreferenceMutation();
  const preferences = data?.myNotificationPreferences ?? [];

  const change = async (
    preference: Preference,
    channels: { inPortal: boolean; email: boolean },
  ) => {
    try {
      await save({
        variables: {
          input: { kind: preference.kind as NotificationKind, ...channels },
        },
      });
    } catch (err) {
      notify(errorMessage(err, t('That preference could not be saved.')), 'error');
    }
  };

  return (
    <Box sx={readingPanel}>
      <Heading level={6} sx={{ mb: 0.5 }}>
        {t('Notifications')}
      </Heading>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t('The first switch is the bell in the portal. The second also sends you an email.')}
      </Text>
      {loading && preferences.length === 0 && <LinearProgress sx={{ mb: 1 }} />}
      {preferences.length > 0 && (
        <Flex direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pr: 0.5 }}>
          <Text size="caption" color="text.secondary" sx={{ width: 58, textAlign: 'center' }}>
            {t('Portal')}
          </Text>
          <Text size="caption" color="text.secondary" sx={{ width: 58, textAlign: 'center' }}>
            {t('Email')}
          </Text>
        </Flex>
      )}
      {error && (
        <Alert severity="error">{errorMessage(error, t('Preferences unavailable.'))}</Alert>
      )}
      {preferences.map((preference) => (
        <PreferenceRow
          key={preference.kind}
          preference={preference}
          saving={saving}
          onChange={change}
        />
      ))}
    </Box>
  );
}
