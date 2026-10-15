import { useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { usePermissions } from '@exyconn/shell/hooks/usePermissions';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCrmPropertiesQuery, type CrmObject } from '@exyconn/shell/graphql/generated';
import { useObjectSchema } from '../../records/schema';
import { CrmPropertyForm, type CrmPropertyRow } from './forms/crm-property';
import { PROPERTY_COLUMNS } from './property-columns';
import { builtInKeysOf, propertyTableRows, type PropertyTableRow } from './property-rows';
import { PROPERTY_PERMISSION_MODULE } from './property-types';
import { useRemoveProperty } from './useRemoveProperty';

interface PropertiesPanelProps {
  object: CrmObject;
  /** What the record type's properties are for, in a sentence. */
  intro: string;
}

const isBuiltIn = (row: PropertyTableRow) => row.property === null;

/** One record type's properties: the built-in ones, read-only, and the company's own. */
export function PropertiesPanel({ object, intro }: Readonly<PropertiesPanelProps>) {
  const t = useT();
  const { can } = usePermissions();
  const may = (action: 'create' | 'edit' | 'delete') => can(PROPERTY_PERMISSION_MODULE, action);
  const custom = useCrmPropertiesQuery({ variables: { object }, fetchPolicy: 'cache-and-network' });
  const schema = useObjectSchema(object);
  const dialog = useCrudDialog<CrmPropertyRow>();
  const remove = useRemoveProperty(object);

  const customRows = custom.data?.crmProperties ?? [];
  const rows = propertyTableRows(customRows, schema.properties);
  const builtInKeys = useMemo(() => builtInKeysOf(schema.properties), [schema.properties]);
  const error = custom.error ?? schema.error;

  const actions: RowAction<PropertyTableRow>[] = [];
  if (may('edit')) {
    actions.push({
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      ariaLabel: 'Edit property',
      hidden: isBuiltIn,
      onClick: (row) => row.property && dialog.openEdit(row.property),
    });
  }
  if (may('delete')) {
    actions.push({
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      ariaLabel: 'Delete property',
      color: 'error',
      hidden: isBuiltIn,
      onClick: (row) => {
        if (row.property) {
          remove(row.property).catch((cause: unknown) =>
            portalLogger.error('Deleting a CRM property failed', cause, { object }),
          );
        }
      },
    });
  }

  const createAction = may('create') ? dialog.openCreate : undefined;
  const loaded = custom.data !== undefined;
  const dialogTitle = dialog.editing ? t('Edit property') : t('Create property');

  return (
    <Flex direction="column" spacing={2}>
      <Flex
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Text size="sm" color="text.secondary">
          {t(intro)}
        </Text>
        {createAction && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={createAction}>
            {t('Create property')}
          </Button>
        )}
      </Flex>
      {error && (
        <Alert severity="error">{t(errorMessage(error, 'Could not load the properties'))}</Alert>
      )}
      {loaded && customRows.length === 0 && (
        <EmptyState
          title="No custom properties yet"
          description="Add one for anything your team needs to record that the built-in properties below do not cover."
          actionLabel={createAction ? 'Create property' : undefined}
          onAction={createAction}
        />
      )}
      <DataTable
        columns={PROPERTY_COLUMNS}
        rows={rows}
        actions={actions}
        loading={!loaded && custom.loading}
        onRefresh={() => Promise.all([custom.refetch(), schema.refetch()])}
      />
      <CrudDialog open={dialog.open} title={dialogTitle} onClose={dialog.close}>
        <CrmPropertyForm
          object={object}
          initial={dialog.editing}
          builtInKeys={builtInKeys}
          onDone={dialog.close}
          onCancel={dialog.close}
        />
      </CrudDialog>
    </Flex>
  );
}
