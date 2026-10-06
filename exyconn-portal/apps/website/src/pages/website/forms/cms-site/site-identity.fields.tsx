import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import {
  RhfChipsInput,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { RhfMediaField } from '../../../cms/media';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active — served on its domains' },
  { value: 'DRAFT', label: 'Draft — not served yet' },
];

/** Name, key, domains, status, markets, locale and favicon. */
export function SiteIdentityFields({ siteId }: Readonly<{ siteId?: string }>) {
  const t = useT();
  return (
    <>
      <Text weight="semibold">{t('Website')}</Text>
      <RhfTextField name="name" label="Name" />
      <RhfTextField
        name="slug"
        label="Key"
        helperText="Lower-case letters, digits and dashes. Used in portal addresses (/website/s/<key>)."
      />
      <RhfChipsInput
        name="domains"
        label="Domains"
        helperText="Host names this site answers on, like example.com. Type one and press Enter."
      />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfSwitch name="markets" label="Serve pages under a market prefix (/en-us/…)" />
      <RhfTextField name="defaultLocale" label="Default locale" helperText="e.g. en, en-US, de" />
      <RhfMediaField
        name="faviconUrl"
        label="Favicon"
        siteId={siteId}
        helperText="A square PNG or SVG. Save the site first to pick from its media."
      />
    </>
  );
}
