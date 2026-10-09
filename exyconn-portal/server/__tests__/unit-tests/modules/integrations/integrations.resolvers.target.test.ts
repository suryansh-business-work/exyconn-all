import { GraphQLError } from 'graphql';
import { integrationsResolvers } from '../../../../src/modules/integrations';
import { WebhookModel } from '../../../../src/modules/integrations/webhook.model';
import { assertPublicHttpsUrl } from '../../../../src/utils/safeFetch';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

// Only the address check is replaced, so a failure that is NOT a refused address can be staged.
jest.mock('../../../../src/utils/safeFetch', () => ({
  ...jest.requireActual('../../../../src/utils/safeFetch'),
  assertPublicHttpsUrl: jest.fn(),
}));

const admin: GraphQLContext = {
  user: { id: 'u1', email: 'admin@acme.test', roles: [ROLES.ADMIN] },
};

const create = () =>
  integrationsResolvers.Mutation.createWebhook(
    null,
    { name: 'Ops', url: 'https://receiver.example.com/hook', events: ['invoice.paid'] },
    admin,
  );

describe('createWebhook address check', () => {
  it('lets an unexpected failure of the check surface as it is, not as bad input', async () => {
    const failure = new Error('resolver crashed');
    jest.mocked(assertPublicHttpsUrl).mockRejectedValueOnce(failure);

    const error = await create().catch((error_: unknown) => error_);

    expect(error).toBe(failure);
    expect(error).not.toBeInstanceOf(GraphQLError);
    expect(await WebhookModel.countDocuments()).toBe(0);
  });

  it('creates the endpoint once the check passes', async () => {
    jest
      .mocked(assertPublicHttpsUrl)
      .mockResolvedValueOnce(new URL('https://receiver.example.com/hook'));

    const created = await create();

    expect(assertPublicHttpsUrl).toHaveBeenCalledWith('https://receiver.example.com/hook');
    expect(await WebhookModel.findById(created.webhook.id).lean()).not.toBeNull();
  });
});
