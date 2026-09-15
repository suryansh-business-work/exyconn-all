import { Types } from 'mongoose';
import { OrganizationModel } from '../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../src/lib/platformAccess';
import { runAsPlatform } from '../../src/lib/tenant';

/**
 * Suites that drive a platform feature (Tech configs, logs, the status page, the website CMS)
 * act as staff of the platform operator organization — anybody else is refused.
 */
export const OPERATOR_ORGANIZATION_ID = String(new Types.ObjectId());

/**
 * Writes (or flags) the operator organization. Call it in a `beforeEach`: the harness empties
 * every collection after each test, and the operator id is cached between checks.
 */
export async function seedPlatformOperator(id: string = OPERATOR_ORGANIZATION_ID): Promise<void> {
  invalidatePlatformOperatorCache();
  await runAsPlatform(() =>
    OrganizationModel.updateOne(
      { _id: id },
      {
        $setOnInsert: { name: 'Exyconn', slug: `exyconn-${id}`, currency: 'USD' },
        $set: { isPlatformOperator: true },
      },
      { upsert: true },
    ),
  );
}
