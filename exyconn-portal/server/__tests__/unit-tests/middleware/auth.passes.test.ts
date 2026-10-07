import { contactForPass } from '../../../src/modules/clienthub';
import { visitorForPass } from '../../../src/modules/whatsapp-demo/visitor';
import { principalForApiKey } from '../../../src/modules/integrations/api-key.service';
import { signToken } from '../../../src/utils/jwt';
import { ROLES } from '../../../src/constants/roles';
import { contextOf, requestWith, seedPerson } from './authHarness';

jest.mock('../../../src/modules/clienthub', () => ({
  CLIENT_PASS_HEADER: 'x-client-pass',
  contactForPass: jest.fn(),
}));
jest.mock('../../../src/modules/whatsapp-demo/visitor', () => ({
  VISITOR_HEADER: 'x-demo-visitor',
  visitorForPass: jest.fn(),
}));
jest.mock('../../../src/modules/integrations/api-key.service', () => ({
  principalForApiKey: jest.fn(),
}));
jest.mock('../../../src/modules/admin/presence', () => ({
  recordActivity: jest.fn().mockResolvedValue(undefined),
}));

const contact = { id: 'contact-1', email: 'client@example.com' };
const visitor = { id: 'visitor-1', email: 'visitor@example.com' };
const anonymousShape = { user: null, organizationId: null, ip: '198.51.100.4' };

describe('buildContext without a session', () => {
  it('is anonymous, and names an unknown address when Express has none', async () => {
    const { ctx, scope } = await contextOf(
      requestWith({ headers: { origin: 'https://hr.test', 'user-agent': 'jest' } }),
    );
    expect(ctx).toEqual({
      user: null,
      organizationId: null,
      ip: 'unknown',
      origin: 'https://hr.test',
      userAgent: 'jest',
    });
    expect(scope).toEqual({ organizationId: null, platform: false });
  });

  it('ignores an authorization header that is not a Bearer token', async () => {
    const { ctx } = await contextOf(
      requestWith({ ip: '198.51.100.4', headers: { authorization: 'Basic abc' } }),
    );
    expect(ctx).toMatchObject(anonymousShape);
  });

  it('treats a forged token as nobody', async () => {
    const { ctx } = await contextOf(
      requestWith({ ip: '198.51.100.4', headers: { authorization: 'Bearer not.a.jwt' } }),
    );
    expect(ctx).toMatchObject(anonymousShape);
  });
});

describe('buildContext for pass holders', () => {
  it('speaks only for the client hub contact, even with a portal session alongside', async () => {
    jest.mocked(contactForPass).mockResolvedValueOnce(contact as never);
    const person = await seedPerson(null, [ROLES.ADMIN]);
    const token = signToken({ id: person.id, email: person.email, roles: [ROLES.ADMIN] });
    const { ctx, scope } = await contextOf(
      requestWith({
        ip: '198.51.100.4',
        headers: { 'x-client-pass': 'pass-1', authorization: `Bearer ${token}` },
      }),
    );
    expect(contactForPass).toHaveBeenCalledWith('pass-1');
    expect(ctx).toMatchObject({ ...anonymousShape, clientContact: contact });
    expect(scope.organizationId).toBeNull();
  });

  it('is nobody when the client pass is not live', async () => {
    jest.mocked(contactForPass).mockResolvedValueOnce(null);
    const { ctx } = await contextOf(
      requestWith({ ip: '198.51.100.4', headers: { 'x-client-pass': 'stale' } }),
    );
    expect(ctx).toEqual({ ...anonymousShape, origin: undefined, userAgent: undefined });
  });

  it('recognises a WhatsApp demo visitor, and nobody with a dead pass', async () => {
    jest.mocked(visitorForPass).mockResolvedValueOnce(visitor as never);
    const live = await contextOf(requestWith({ headers: { 'x-demo-visitor': 'v-pass' } }));
    expect(live.ctx.demoVisitor).toEqual(visitor);
    expect(live.ctx.user).toBeNull();

    jest.mocked(visitorForPass).mockResolvedValueOnce(null);
    const dead = await contextOf(requestWith({ headers: { 'x-demo-visitor': 'old' } }));
    expect(dead.ctx.demoVisitor).toBeUndefined();
  });

  it('never asks about a visitor pass that is not there', async () => {
    await contextOf(requestWith({ headers: { 'x-demo-visitor': ['a', 'b'] } }));
    expect(visitorForPass).not.toHaveBeenCalled();
  });
});

describe('buildContext for an API key', () => {
  it('resolves the key to the same shape a person has, inside its company', async () => {
    jest.mocked(principalForApiKey).mockResolvedValueOnce({
      id: 'key-1',
      name: 'Zapier',
      roles: [ROLES.CRM],
      organizationId: 'org-1',
    });
    const { ctx, scope } = await contextOf(
      requestWith({ ip: '198.51.100.4', headers: { 'x-api-key': 'exy_live_123' } }),
    );
    expect(principalForApiKey).toHaveBeenCalledWith('exy_live_123');
    expect(ctx).toMatchObject({
      user: { id: 'key-1', email: 'Zapier (API key)', roles: [ROLES.CRM], organizationId: 'org-1' },
      organizationId: 'org-1',
      ip: '198.51.100.4',
    });
    expect(scope).toEqual({ organizationId: 'org-1', platform: false });
  });

  it('is nobody when the key is not recognised', async () => {
    jest.mocked(principalForApiKey).mockResolvedValueOnce(null);
    const { ctx } = await contextOf(
      requestWith({ ip: '198.51.100.4', headers: { 'x-api-key': 'exy_live_bad' } }),
    );
    expect(ctx).toMatchObject(anonymousShape);
  });

  it('skips an empty key header', async () => {
    await contextOf(requestWith({ headers: { 'x-api-key': '' } }));
    expect(principalForApiKey).not.toHaveBeenCalled();
  });
});
