import { Typography } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useT } from '@exyconn/i18n';
import { KEEP_SECRET_HINT } from '../../../environment-variables/secret';
import { BOOL_OPTIONS } from './calling-bot-config.types';

/** The Vobiz account that rings real phones. Leave it empty for browser calls only. */
export function CallingBotPhoneFields({ isEdit }: Readonly<{ isEdit: boolean }>) {
  const t = useT();
  return (
    <>
      <Typography variant="subtitle2" component="h3" sx={{ mt: 1 }}>
        {t('Phone calls (Vobiz) — optional')}
      </Typography>
      <RhfTextField name="vobizAuthId" label="Vobiz Auth ID" />
      <RhfTextField
        name="vobizAuthToken"
        label="Vobiz Auth Token"
        type="password"
        helperText={isEdit ? KEEP_SECRET_HINT : 'From the Vobiz console'}
      />
      <RhfTextField
        name="vobizNumber"
        label="Calling number"
        helperText="The Vobiz number calls come from, e.g. +918012345678."
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </>
  );
}
