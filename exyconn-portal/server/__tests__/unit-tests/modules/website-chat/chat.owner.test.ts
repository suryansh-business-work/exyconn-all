import { asChatOwner, chatOwnerId } from '../../../../src/modules/website-chat/chat.owner';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { currentOrganizationId, runAsPlatform } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { codeOf } from '../codeOf';

beforeEach(() => invalidatePlatformOperatorCache());

describe('chat owner', () => {
  it('refuses while no company operates the platform', async () => {
    await expect(chatOwnerId()).rejects.toThrow('The chat is not available yet.');
    expect(await codeOf(asChatOwner(async () => 'never'))).toBe('BAD_USER_INPUT');
  });

  it("runs chat work inside the operator's company", async () => {
    const operator = await runAsPlatform(() =>
      OrganizationModel.create({
        name: 'Exyconn',
        slug: 'exyconn',
        currency: 'USD',
        isPlatformOperator: true,
      }),
    );
    const id = String(operator._id);
    await expect(chatOwnerId()).resolves.toBe(id);
    await expect(asChatOwner(async () => currentOrganizationId())).resolves.toBe(id);
  });
});
