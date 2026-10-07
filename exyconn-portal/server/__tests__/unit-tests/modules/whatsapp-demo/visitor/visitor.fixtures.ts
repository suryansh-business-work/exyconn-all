import { OrganizationModel } from '../../../../../src/modules/organizations';
import { WhatsappDemoVisitorModel } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.model';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { useTestOrganization } from '../../../../helpers';

/**
 * Runs a suite inside the company that operates the website — where the demos and their
 * visitors are filed — flagged as the platform operator before every test.
 */
export function useOperatorOrganization(): string {
  const organizationId = useTestOrganization();
  beforeEach(async () => {
    await runAsPlatform(() =>
      OrganizationModel.updateOne({ _id: organizationId }, { isPlatformOperator: true }),
    );
    invalidatePlatformOperatorCache();
  });
  return organizationId;
}

/** Stops the company being the operator, as before the platform was set up. */
export async function withoutOperator(organizationId: string): Promise<void> {
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { isPlatformOperator: false }),
  );
  invalidatePlatformOperatorCache();
}

/** A lead, filed in the company in scope. */
export function seedVisitor(fields: Record<string, unknown> = {}) {
  return WhatsappDemoVisitorModel.create({
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    company: 'Acme',
    phone: '+91 98000 00001',
    source: 'WEBSITE',
    ...fields,
  });
}
