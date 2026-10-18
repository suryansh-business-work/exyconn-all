import { Link as RouterLink } from 'react-router-dom';
import { Link, Text } from '@exyconn/shell/components/ui';
import type { LeadImportPreview } from '../leadTypes';

/** A previewed business, linked to the CRM company it already is (when it is one). */
export function CompanyLink({ preview }: Readonly<{ preview: LeadImportPreview }>) {
  if (!preview.existingCompanyId) {
    return <Text size="sm">{preview.name}</Text>;
  }
  return (
    <Link
      component={RouterLink}
      to={`/companies/${preview.existingCompanyId}`}
      variant="body2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {preview.existingName ?? preview.name}
    </Link>
  );
}
