import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { PropertiesPanel } from './PropertiesPanel';

/** Route the record-type tabs live under; each tab is a slug beneath it. */
export const PROPERTIES_PATH = '/crm/settings/properties';

/** One tab per record type. `key` keeps each tab's open form from leaking into the next. */
const TABS: TabberItem[] = [
  {
    slug: 'leads',
    label: 'Leads',
    content: (
      <PropertiesPanel
        key={CrmObject.Lead}
        object={CrmObject.Lead}
        intro="The details kept on every lead. Built-in properties come with the CRM; add your own for anything else your team tracks."
      />
    ),
  },
  {
    slug: 'companies',
    label: 'Companies',
    content: (
      <PropertiesPanel
        key={CrmObject.Company}
        object={CrmObject.Company}
        intro="The details kept on every company. Built-in properties come with the CRM; add your own for anything else your team tracks."
      />
    ),
  },
  {
    slug: 'contacts',
    label: 'Contacts',
    content: (
      <PropertiesPanel
        key={CrmObject.Contact}
        object={CrmObject.Contact}
        intro="The details kept on every contact. Built-in properties come with the CRM; add your own for anything else your team tracks."
      />
    ),
  },
];

/**
 * CRM > Settings > Properties: the fields every lead, company and contact has. Custom ones
 * show up as columns, filters, import and export fields and on the record forms.
 */
export function PropertiesPage() {
  return (
    <Box>
      <PageHeader
        title="Properties"
        subtitle="The fields kept on every lead, company and contact"
      />
      <Box sx={readingPanel}>
        <Tabber basePath={PROPERTIES_PATH} items={TABS} ariaLabel="Record types" />
      </Box>
    </Box>
  );
}
