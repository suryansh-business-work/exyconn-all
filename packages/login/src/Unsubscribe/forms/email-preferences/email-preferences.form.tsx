import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUpdateEmailPreferencesMutation } from '@exyconn/shell/graphql/generated';
import {
  emailPreferencesSchema,
  optedOutIds,
  toValues,
  type EmailPreferences,
  type EmailPreferencesValues,
} from './email-preferences.types';

interface EmailPreferencesFormProps {
  token: string;
  preferences: EmailPreferences;
  onSaved: (message: string, next: EmailPreferences) => void;
  onError: (message: string) => void;
}

/**
 * A recipient's choices: each kind of marketing email on or off, or all of it off. Already
 * unsubscribed from everything is shown as such — only the sender can lift that, so this page
 * never re-subscribes anybody.
 */
export function EmailPreferencesForm({
  token,
  preferences,
  onSaved,
  onError,
}: Readonly<EmailPreferencesFormProps>) {
  const t = useT();
  const [update] = useUpdateEmailPreferencesMutation();
  const methods = useForm<EmailPreferencesValues>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: toValues(preferences),
  });
  const unsubscribeAll = useWatch({ control: methods.control, name: 'unsubscribeAll' });

  const submit = async (values: EmailPreferencesValues) => {
    try {
      const res = await update({
        variables: {
          token,
          optedOutCategoryIds: optedOutIds(values),
          unsubscribeAll: values.unsubscribeAll,
        },
      });
      const next = res.data?.updateEmailPreferences;
      if (next) {
        onSaved(
          values.unsubscribeAll
            ? 'You have been unsubscribed from all marketing emails.'
            : 'Your preferences are saved.',
          next,
        );
      }
    } catch (err) {
      onError(errorMessage(err, 'Your preferences could not be saved'));
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit
      onCancel={() => methods.reset()}
      submitLabel="Save preferences"
    >
      {preferences.categories.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t(
            'There are no separate email categories. You can still unsubscribe from all marketing.',
          )}
        </Text>
      )}
      {preferences.categories.map((category) => (
        <Flex key={category.id} direction="column" spacing={0}>
          <RhfSwitch name={`subscribed.${category.id}`} label={category.name} />
          {category.description && (
            <Text size="caption" color="text.secondary" sx={{ pl: 6 }}>
              {category.description}
            </Text>
          )}
        </Flex>
      ))}
      <Divider />
      <RhfSwitch name="unsubscribeAll" label="Unsubscribe from all marketing emails" />
      {unsubscribeAll && (
        <Alert severity="warning">
          {t(
            'You will stop receiving every marketing email from us. Account and security emails still arrive.',
          )}
        </Alert>
      )}
    </EntityForm>
  );
}
