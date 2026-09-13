import { OrganizationModel } from './organization.model';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';

/**
 * Runs `work` once for every active company, each turn inside that company's own scope.
 *
 * This is how everything that used to run once for the whole install now runs — the boot-time
 * defaults, and every scheduled job (payslips, digests, retention, campaigns). One company's
 * failure is logged and the rest still run: a company with a bad setting must not stop
 * payslips going out everywhere else.
 */
export async function forEachOrganization(
  work: () => Promise<unknown>,
  what = 'scheduled work',
): Promise<void> {
  const organizations = await runAsPlatform(() =>
    OrganizationModel.find({ status: 'ACTIVE' }).select('name').lean(),
  );
  for (const organization of organizations) {
    try {
      await runForOrganization(String(organization._id), work);
    } catch (error) {
      logger.error(error, `${what} failed for ${organization.name}`);
    }
  }
}
