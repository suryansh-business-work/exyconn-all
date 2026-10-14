import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfCodeEditor } from '@exyconn/shell/components/form/rhf';

/** Markup and CSS added to every page of the site. */
export function SiteCodeFields() {
  const t = useT();
  return (
    <>
      <Text weight="semibold">{t('Code')}</Text>
      <RhfCodeEditor
        name="headHtml"
        label="Head HTML"
        language="html"
        height={160}
        helperText="Added inside <head> on every page: meta tags, analytics. Only paste code you trust."
      />
      <RhfCodeEditor
        name="bodyEndHtml"
        label="Body-end HTML"
        language="html"
        height={160}
        helperText="Added before </body> on every page: chat widgets, tracking scripts."
      />
      <RhfCodeEditor
        name="globalCss"
        label="Global CSS"
        language="css"
        height={280}
        helperText="Styles every page and the page builder's canvas. Prefer design-system tokens: var(--color-primary)."
      />
    </>
  );
}
