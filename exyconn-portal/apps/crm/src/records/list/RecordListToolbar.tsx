import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex } from '@exyconn/shell/components/ui';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import type { ColumnChoice } from '../columns/buildColumns';
import { ColumnsButton } from '../columns/ColumnsButton';
import { ActiveFilterChips } from '../filters/ActiveFilterChips';
import { FiltersButton } from '../filters/FiltersButton';
import { NearFilterButton, NearFilterChip, type NearFilter } from '../filters/near-filter';
import { PresenceChips } from '../filters/PresenceChips';
import type { CrmPropertyInfo } from '../schema';
import { ViewBar } from '../views/ViewBar';
import { withoutCondition, type FilterGroup, type RecordQuerySnapshot } from './recordQuery';
import { SortButton } from './sort';
import type { RecordQuery } from './useRecordQuery';

/** The parts of `useRecordList`'s result the toolbar reads; pass the whole result. */
export interface RecordListToolbarSource {
  object: CrmObject;
  schema: {
    properties: readonly CrmPropertyInfo[];
    fields: readonly CrmPropertyInfo[];
    error?: unknown;
  };
  list: RecordQuery;
  view: {
    choices: readonly ColumnChoice[];
    visible: readonly string[];
    defaults: readonly string[];
  };
  snapshot: RecordQuerySnapshot;
}

interface RecordListToolbarProps {
  records: RecordListToolbarSource;
  /** The default view's name, e.g. "All leads". */
  allLabel: string;
  /** Offers "Near a location", for record types with a map position (companies, contacts). */
  nearby?: boolean;
  /**
   * The slot for the import/export buttons, handed the query the list is showing — search,
   * filter groups, sorts and the visible columns' property keys — so an export matches it.
   */
  renderActions?: (query: RecordQuerySnapshot) => ReactNode;
}

/** Saved views, then Filters / the Has email-style toggles / Sort / Columns and the page's actions, then the active filters. */
export function RecordListToolbar({
  records,
  allLabel,
  nearby = false,
  renderActions,
}: Readonly<RecordListToolbarProps>) {
  const t = useT();
  const { object, schema, list, view, snapshot } = records;
  const { properties, fields } = schema;
  const applyGroups = (next: FilterGroup[]) => list.apply({ groups: next });
  const { groups, sorts, near = null } = list.query;
  const applyNear = (next: NearFilter | null) => list.apply({ near: next });

  return (
    <Flex direction="column" spacing={1.5} sx={{ mb: 1.5 }}>
      <ViewBar object={object} list={list} allLabel={allLabel} />
      {Boolean(schema.error) && (
        <Alert severity="error">
          {t('Could not load the record properties, so filters and columns are limited.')}
        </Alert>
      )}
      <Flex direction="row" wrap spacing={1} alignItems="center">
        <FiltersButton properties={properties} groups={groups} onApply={applyGroups} />
        <PresenceChips properties={properties} groups={groups} onApply={applyGroups} />
        {nearby && <NearFilterButton near={near} onApply={applyNear} />}
        <SortButton
          properties={fields}
          sorts={sorts}
          onApply={(next) => list.apply({ sorts: next }, true)}
        />
        <ColumnsButton
          choices={view.choices}
          visible={view.visible}
          defaults={view.defaults}
          onApply={(columns) => list.apply({ columns })}
        />
        <Box sx={{ flex: 1 }} />
        {renderActions?.(snapshot)}
      </Flex>
      <ActiveFilterChips
        properties={properties}
        groups={groups}
        onRemove={(id) => list.apply({ groups: withoutCondition(groups, id) })}
      />
      <NearFilterChip near={near} onRemove={() => applyNear(null)} />
    </Flex>
  );
}
