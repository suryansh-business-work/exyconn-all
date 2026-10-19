import type { GraphQLContext } from '../../../../src/middleware/auth';
import * as service from '../../../../src/modules/email-verification/email-verification.service';
import { emailVerificationResolvers } from '../../../../src/modules/email-verification/email-verification.resolvers';
import { useTestOrganization } from '../../../helpers';
import { fakeReacher } from './fakeReacher';

useTestOrganization();

const resolve = emailVerificationResolvers.CrmEmailAddress.verification;
const requestContext = (): GraphQLContext => ({ user: null });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CrmEmailAddress.verification', () => {
  it('answers with the stored check of the address, whatever its case', async () => {
    fakeReacher();
    await service.verifyEmail('asha@acme.test', { source: 'CRM', checkedBy: 'Meera' });

    const found = await resolve({ address: ' Asha@Acme.TEST ' }, {}, requestContext());

    expect(found).toMatchObject({
      email: 'asha@acme.test',
      status: 'VERIFIED',
      checkedBy: 'Meera',
    });
    expect(found).toHaveProperty('id');
  });

  it('answers null for an address never checked, and for an empty one', async () => {
    const ctx = requestContext();
    await expect(resolve({ address: 'nobody@acme.test' }, {}, ctx)).resolves.toBeNull();
    expect(resolve({ address: '' }, {}, ctx)).toBeNull();
  });

  it('looks every address of one request up together', async () => {
    const lookup = jest.spyOn(service, 'verificationsFor');
    const ctx = requestContext();

    await Promise.all([
      resolve({ address: 'a@acme.test' }, {}, ctx),
      resolve({ address: 'b@acme.test' }, {}, ctx),
    ]);

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(['a@acme.test', 'b@acme.test']);
  });
});
