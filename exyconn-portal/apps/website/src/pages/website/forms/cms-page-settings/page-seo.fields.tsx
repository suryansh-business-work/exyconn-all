import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfCodeEditor, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
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
      <RhfTextField
        name="seo.description"
        label="Description"
        multiline
        minRows={2}
        helperText="Optional. The snippet under the title in search results, up to 500 characters."
      />
      <RhfTextField name="seo.keywords" label="Keywords" helperText="Comma-separated." />
      <RhfMediaField
        name="seo.ogImageUrl"
        label="Share image"
        siteId={siteId}
        helperText="Optional. Shown in link previews; the site default is used when empty."
      />
      <RhfTextField
        name="seo.canonical"
        label="Canonical URL"
        helperText="Only when another URL is the original of this page."
      />
      <RhfSwitch name="seo.noindex" label="Hide from search engines (noindex)" />
      <RhfCodeEditor
        name="seo.jsonLd"
        label="Structured data (JSON-LD)"
        language="json"
        height={200}
        helperText="A schema.org JSON object, added to the page head."
      />
    </>
  );
}
