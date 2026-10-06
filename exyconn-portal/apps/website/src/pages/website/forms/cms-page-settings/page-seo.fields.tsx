import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RhfMediaField } from '../../../cms/media';

/** The page's own title, description, share image and indexing. */
export function PageSeoFields({ siteId }: Readonly<{ siteId: string }>) {
  const t = useT();
  return (
    <>
      <Text weight="semibold">{t('Search and sharing')}</Text>
      <RhfTextField
        name="seo.title"
        label="SEO title"
        helperText="Shown in search results; the page title when empty."
      />
      <RhfTextField name="seo.description" label="Description" multiline minRows={2} />
      <RhfTextField name="seo.keywords" label="Keywords" helperText="Comma-separated." />
      <RhfMediaField name="seo.ogImageUrl" label="Share image" siteId={siteId} />
      <RhfTextField
        name="seo.canonical"
        label="Canonical URL"
        helperText="Only when another URL is the original of this page."
      />
      <RhfSwitch name="seo.noindex" label="Hide from search engines (noindex)" />
      <RhfTextField
        name="seo.jsonLd"
        label="Structured data (JSON-LD)"
        multiline
        minRows={4}
        slotProps={{ htmlInput: { style: { fontFamily: 'monospace' }, spellCheck: false } }}
        helperText="A schema.org JSON object, added to the page head."
      />
    </>
  );
}
