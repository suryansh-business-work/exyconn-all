import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

const CODE_FIELD = { fontFamily: 'monospace', fontSize: 13 } as const;

/** Markup and CSS added to every page of the site. */
export function SiteCodeFields() {
  const t = useT();
  return (
    <>
      <Text weight="semibold">{t('Code')}</Text>
      <RhfTextField
        name="headHtml"
        label="Head HTML"
        multiline
        minRows={4}
        slotProps={{ htmlInput: { style: CODE_FIELD, spellCheck: false } }}
        helperText="Added inside <head> on every page: meta tags, analytics. Only paste code you trust."
      />
      <RhfTextField
        name="bodyEndHtml"
        label="Body-end HTML"
        multiline
        minRows={4}
        slotProps={{ htmlInput: { style: CODE_FIELD, spellCheck: false } }}
        helperText="Added before </body> on every page: chat widgets, tracking scripts."
      />
      <RhfTextField
        name="globalCss"
        label="Global CSS"
        multiline
        minRows={6}
        slotProps={{ htmlInput: { style: CODE_FIELD, spellCheck: false } }}
        helperText="Styles every page and the page builder's canvas. Prefer design-system tokens: var(--color-primary)."
      />
    </>
  );
}
