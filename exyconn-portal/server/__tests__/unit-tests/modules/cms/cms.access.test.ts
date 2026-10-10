import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { cmsEditor } from '../../../../src/modules/cms/cms.access';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { seedUser } from '../../../helpers';
import { EDITOR_EMAIL, editorCtx } from './cms.fixtures';

const operatorOrganization = () =>
  runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  );

const inOrganization = (organizationId: string, user: GraphQLContext['user']): GraphQLContext => ({
  user,
  organizationId,
});

beforeEach(() => {
  invalidatePlatformOperatorCache();
});

describe('cmsEditor', () => {
  it('lets a platform administrator in and names them from their account', async () => {
    const user = await seedUser('asha@exyconn.test', randomBytes(12).toString('hex'), [
      ROLES.SUPER_ADMIN,
    ]);
    const ctx: GraphQLContext = {
      user: { id: user._id.toHexString(), roles: [ROLES.SUPER_ADMIN], email: 'asha@exyconn.test' },
    };

    await expect(cmsEditor(ctx, 'CmsPage', 'EDIT')).resolves.toBe('asha');
  });

  it('falls back to the token email when the account has no record', async () => {
    await expect(cmsEditor(editorCtx(), 'CmsSite', 'VIEW')).resolves.toBe(EDITOR_EMAIL);
  });

  it('lets the website team of the operator company in', async () => {
    const operator = await operatorOrganization();
    const ctx = inOrganization(operator._id.toHexString(), {
      id: new Types.ObjectId().toHexString(),
      roles: [ROLES.WEBSITE],
      email: 'web@exyconn.test',
      organizationId: operator._id.toHexString(),
    });

    await expect(cmsEditor(ctx, 'Newsletter', 'CREATE')).resolves.toBe('web@exyconn.test');
  });

  it('refuses the operator company staff outside the website team', async () => {
    const operator = await operatorOrganization();
    const ctx = inOrganization(operator._id.toHexString(), {
      id: new Types.ObjectId().toHexString(),
      roles: [ROLES.FINANCE],
      email: 'money@exyconn.test',
      organizationId: operator._id.toHexString(),
    });

    await expect(cmsEditor(ctx, 'CmsPage', 'VIEW')).rejects.toThrow(
      'You do not have access to this resource',
    );
  });

  it('refuses the website team of a customer company', async () => {
    await operatorOrganization();
    const customer = new Types.ObjectId().toHexString();
    const ctx = inOrganization(customer, {
      id: new Types.ObjectId().toHexString(),
      roles: [ROLES.WEBSITE],
      email: 'web@customer.test',
      organizationId: customer,
    });

    await expect(cmsEditor(ctx, 'CmsPage', 'VIEW')).rejects.toThrow(
      'Only the platform operator may manage this.',
    );
  });

  it('refuses somebody who is not signed in', async () => {
    await expect(cmsEditor({ user: null }, 'CmsPage', 'VIEW')).rejects.toThrow(
      'Authentication required',
    );
  });
});
