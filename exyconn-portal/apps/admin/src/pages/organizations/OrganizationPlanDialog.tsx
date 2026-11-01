import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { OrganizationPlanForm } from './forms/organization-plan';
import type { OrganizationRow } from './forms/organization';

/** The plan dialog of Admin › Organizations: open while a company is picked. */
export function OrganizationPlanDialog({
  organization,
  onClose,
}: Readonly<{ organization: OrganizationRow | null; onClose: () => void }>) {
  const t = useT();
  return (
    <CrudDialog
      open={organization !== null}
      title={organization ? t('Plan for {name}', { name: organization.name }) : t('Plan')}
      onClose={onClose}
    >
      {organization ? (
        <OrganizationPlanForm
          organizationId={organization.id}
          organizationName={organization.name}
          onDone={onClose}
          onCancel={onClose}
        />
      ) : null}
    </CrudDialog>
  );
}
