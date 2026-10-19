import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSaveMarketingFooterMutation } from '@exyconn/shell/graphql/generated';
import {
  marketingFooterSchema,
  type MarketingFooterRow,
  type MarketingFooterValues,
} from './marketing-footer.types';

interface MarketingFooterFormProps {
  initial: MarketingFooterRow;
  onSaved: () => void;
}

/**
 * The footer every marketing email ends with. Branding is yours to change; the unsubscribe
 * and preference links are always added and cannot be removed here.
 */
export function MarketingFooterForm({ initial, onSaved }: Readonly<MarketingFooterFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [save] = useSaveMarketingFooterMutation();
  const methods = useForm<MarketingFooterValues>({
    mode: 'onTouched',
    resolver: zodResolver(marketingFooterSchema),
    defaultValues: initial,
  });
  const submit = async (values: MarketingFooterValues) => {
    try {
      await save({ variables: { input: values } });
      notify('Footer saved', 'success');
      methods.reset(values);
      onSaved();
    } catch (err) {
      notify(errorMessage(err, 'The footer could not be saved'), 'error');
    }
  };
  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit
      onCancel={() => methods.reset(initial)}
      submitLabel="Save footer"
    >
      <Alert severity="info">
        {t(
          'Every marketing email ends with this footer, plus its Unsubscribe and Manage preferences links.',
        )}
      </Alert>
      <RhfTextField name="companyName" label="Company name" required />
      <RhfTextField
        name="contactLine"
        label="Contact details"
        helperText="e.g. support@yourcompany.com · +91 11 4000 0000"
      />
      <RhfTextField
        name="postalAddress"
        label="Postal address"
        required
        multiline
        rows={2}
        helperText="Required in most countries for marketing email."
      />
      <RhfTextField name="privacyUrl" label="Privacy policy link" helperText="Optional." />
      <RhfTextField name="websiteUrl" label="Website link" helperText="Optional." />
      <RhfTextField name="textColor" label="Text colour" helperText="Hex colour, e.g. #6b7280." />
      <RhfTextField name="linkColor" label="Link colour" helperText="Hex colour, e.g. #2563eb." />
    </EntityForm>
  );
}
