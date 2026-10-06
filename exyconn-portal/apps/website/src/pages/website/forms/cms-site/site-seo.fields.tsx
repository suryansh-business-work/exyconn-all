import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RhfMediaField } from '../../../cms/media';

/** What search engines and link previews show when a page sets nothing of its own. */
export function SiteSeoFields({ siteId }: Readonly<{ siteId?: string }>) {
  const t = useT();
  return (
    <>
      <Text weight="semibold">{t('Search and sharing')}</Text>
      <RhfTextField
        name="seo.titleTemplate"
        label="Title template"
        helperText="%s is replaced by the page title, e.g. %s | Exyconn"
      />
      <RhfTextField name="seo.description" label="Default description" multiline minRows={2} />
      <RhfMediaField
        name="seo.ogImageUrl"
        label="Default share image"
        siteId={siteId}
        helperText="1200×630 works best for link previews."
      />
    </>
  );
}
