import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { useSiteOptions } from './useSiteOptions';

/** The header and footer every page wears, the design system and the "not found" page. */
export function SiteStructureFields({ siteId }: Readonly<{ siteId?: string }>) {
  const t = useT();
  const options = useSiteOptions(siteId);
  const hint = siteId ? undefined : 'Available once the site is saved.';
  return (
    <>
      <Text weight="semibold">{t('Layout')}</Text>
      <RhfSelect
        name="headerFragmentId"
        label="Header fragment"
        options={options.headers}
        helperText={hint}
      />
      <RhfSelect
        name="footerFragmentId"
        label="Footer fragment"
        options={options.footers}
        helperText={hint}
      />
      <RhfSelect
        name="designSystemId"
        label="Design system"
        options={options.designSystems}
        helperText={hint ?? 'Its colours, fonts and radii style every page.'}
      />
      <RhfSelect
        name="notFoundPageId"
        label="Not-found (404) page"
        options={options.pages}
        helperText={hint}
      />
    </>
  );
}
