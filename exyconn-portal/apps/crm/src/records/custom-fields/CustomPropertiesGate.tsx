import { useEffect, useMemo, type ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Skeleton, Stack } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { useObjectSchema } from '../schema';
import type { CustomPropertyDef } from './custom-fields.schema';

interface CustomPropertiesGateProps {
  object: CrmObject;
  /** Renders the form once the record type's custom properties are known. */
  children: (properties: CustomPropertyDef[]) => ReactNode;
}

/** Placeholder rows standing in for a form while its properties load. */
const SKELETON_ROWS = ['a', 'b', 'c', 'd'];

/**
 * Holds a record form back until the record type's custom properties are known, so its schema,
 * its starting values and its inputs are all built from the same list. The list comes from the
 * object schema the record lists already read, so it is usually in the cache.
 */
export function CustomPropertiesGate({ object, children }: Readonly<CustomPropertiesGateProps>) {
  const t = useT();
  const { properties, loading, error } = useObjectSchema(object);
  const loaded = properties.length > 0;
  // One array per answer, so a form's schema is rebuilt only when the properties change.
  const custom = useMemo(() => properties.filter((property) => !property.builtIn), [properties]);

  useEffect(() => {
    if (error) {
      portalLogger.error('Could not load the CRM properties for a record form', error, { object });
    }
  }, [error, object]);

  if (error && !loaded) {
    return (
      <Alert severity="error">
        {t(errorMessage(error, 'Could not load the form. Reload the page to try again.'))}
      </Alert>
    );
  }
  if (loading && !loaded) {
    return (
      <Stack spacing={2} aria-busy="true" aria-label={t('Loading the form')}>
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }
  return children(custom);
}
