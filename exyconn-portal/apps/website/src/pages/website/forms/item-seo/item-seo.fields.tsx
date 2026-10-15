import { useT } from '@exyconn/i18n';
import { Divider, Text } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RhfMediaField } from '../../../cms/media';

/**
 * The item's own page meta under `seo.*`: title, description, keywords, share image (upload or
 * pick from the site's media) and indexing. Blank fields keep what the page template builds.
 */
export function ItemSeoFields({ siteId }: Readonly<{ siteId?: string }>) {
  const t = useT();
  return (
    <>
      <Divider />
      <Text weight="semibold">{t('Search and sharing')}</Text>
      <RhfTextField
        name="seo.title"
        label="Meta title"
        helperText="Shown in search results and link previews. Blank uses the page template's."
      />
      <RhfTextField
        name="seo.description"
        label="Meta description"
        multiline
        minRows={2}
        helperText="Up to about 160 characters reads best in search results."
      />
      <RhfTextField name="seo.keywords" label="Meta keywords" helperText="Comma-separated." />
      <RhfMediaField
        name="seo.ogImageUrl"
        label="Meta image"
        siteId={siteId}
        helperText="Shown when the page is shared. Upload one or pick from the media library; 1200×630 works best."
      />
      <RhfSwitch name="seo.noindex" label="Hide from search engines (noindex)" />
    </>
  );
}
