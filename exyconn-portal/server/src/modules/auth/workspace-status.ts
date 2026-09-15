import { OrganizationModel } from '../organizations/organization.model';
import { runAsPlatform } from '../../lib/tenant';
import { unauthenticated } from '../../utils/errors';

/**
 * Refuses a sign-in into a company that has been suspended. An account with no company (a
 * platform administrator) has no workspace to suspend. Shared by the portal and the trackers.
 */
export async function assertWorkspaceOpen(organizationId: string | null): Promise<void> {
  if (organizationId === null) {
    return;
  }
  const organization = await runAsPlatform(() =>
    OrganizationModel.findById(organizationId).select('status').lean(),
  );
  if (organization?.status !== 'ACTIVE') {
    unauthenticated('This workspace is suspended. Contact your administrator.');
  }
}
