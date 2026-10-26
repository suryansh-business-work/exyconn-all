import { providerProfileResolvers } from '../../../../../src/modules/tech/providers/provider-profile.resolvers';
import { providerGuide } from '../../../../../src/modules/tech/providers/provider-guides';
import { ProviderProfileModel } from '../../../../../src/modules/tech/providers/provider-profile.model';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const admin: GraphQLContext = {
  user: { id: 'u1', email: 'tech@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};
const { Query, Mutation } = providerProfileResolvers;
const LOGIN = {
  label: 'Owner',
  username: 'ops@exyconn.com',
  signInMethod: 'EMAIL_PASSWORD',
  password: 'S3cret!',
  notes: '',
};

const SECTIONS = [
  'slack', 'smtp', 'inbound-mail', 'email-verifier', 'email-accounts', 'google-sign-in',
  'google-maps', 'imagekit', 'pexels', 'openai', 'firecrawl', 'stripe', 'razorpay', 'paypal',
  'payoneer', 'godaddy', 'cloudflare', 'github', 'sonarqube',
]; // prettier-ignore

describe('provider guides', () => {
  it('covers every credential section with billing advice, steps and https links', () => {
    for (const section of SECTIONS) {
      const guide = providerGuide(section);
      expect(guide?.billing.message).toMatch(/billing/i);
      expect(guide?.steps.length).toBeGreaterThan(1);
      for (const link of guide?.links ?? []) {
        expect(link.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('says plainly where a separate billing key is needed and where the current one is enough', () => {
    expect(providerGuide('openai')?.billing.need).toBe('REQUIRED');
    expect(providerGuide('stripe')?.billing.need).toBe('SAME_KEY');
    expect(providerGuide('cloudflare')?.billing.need).toBe('PERMISSION');
    expect(providerGuide('slack')?.billing.message).toContain(
      'A separate billing API key is not required.',
    );
  });

  it('answers nothing for a section without a guide', async () => {
    expect(await Query.techProviderProfile(null, { provider: 'dashboard' }, admin)).toBeNull();
  });
});

describe('provider logins and links', () => {
  it('keeps a login’s password sealed, shows it only on request and logs the look', async () => {
    const profile = await Mutation.saveTechProviderLogin(
      null,
      { provider: 'openai', input: LOGIN },
      admin,
    );
    const [login] = profile.logins;
    expect(login).toMatchObject({ label: 'Owner', hasPassword: true, passwordHint: '••••••••' });
    expect(login).not.toHaveProperty('password');

    const raw = await runAsPlatform(() =>
      ProviderProfileModel.findOne().select('+logins.password').lean(),
    );
    expect(raw?.logins[0].password).toMatch(/^v1\./);

    expect(
      await Query.techProviderLoginPassword(null, { provider: 'openai', id: login.id }, admin),
    ).toBe('S3cret!');
    const summaries = (await runAsPlatform(() => AuditLogModel.find().lean())).map(
      (l) => l.summary,
    );
    expect(summaries).toEqual([
      'Saved the openai account Owner',
      'Revealed the openai account password for Owner',
    ]);
  });

  it('keeps the password when an edit leaves it blank, and removes the login', async () => {
    const saved = await Mutation.saveTechProviderLogin(
      null,
      { provider: 'openai', input: LOGIN },
      admin,
    );
    const id = saved.logins[0].id;
    await Mutation.saveTechProviderLogin(
      null,
      {
        provider: 'openai',
        id,
        input: { ...LOGIN, label: 'Owner (Google)', signInMethod: 'GOOGLE', password: '' },
      },
      admin,
    );
    expect(await Query.techProviderLoginPassword(null, { provider: 'openai', id }, admin)).toBe(
      'S3cret!',
    );

    const after = await Mutation.deleteTechProviderLogin(null, { provider: 'openai', id }, admin);
    expect(after.logins).toEqual([]);
  });

  it('adds the team’s own links after the built-in ones, and refuses one that is not a web address', async () => {
    const builtIn =
      (await Query.techProviderProfile(null, { provider: 'stripe' }, admin))?.links ?? [];
    expect(builtIn.every((link) => !link.custom)).toBe(true);

    const profile = await Mutation.saveTechProviderLink(
      null,
      {
        provider: 'stripe',
        input: { label: 'Runbook', url: 'https://wiki.exyconn.com/stripe', kind: 'DOCS' },
      },
      admin,
    );
    const custom = profile.links.at(-1);
    expect(custom).toMatchObject({ label: 'Runbook', custom: true });

    const edited = await Mutation.saveTechProviderLink(
      null,
      {
        provider: 'stripe',
        id: custom?.id,
        input: { label: 'Runbook v2', url: 'https://wiki.exyconn.com/s', kind: 'DOCS' },
      },
      admin,
    );
    expect(edited.links.at(-1)?.label).toBe('Runbook v2');
    await expect(
      Mutation.saveTechProviderLink(
        null,
        { provider: 'stripe', input: { label: 'x', url: 'ftp://x', kind: 'OTHER' } },
        admin,
      ),
    ).rejects.toThrow('Enter a full web address starting with http:// or https://.');

    const removed = await Mutation.deleteTechProviderLink(
      null,
      { provider: 'stripe', id: String(custom?.id) },
      admin,
    );
    expect(removed.links).toHaveLength(builtIn.length);
  });

  it('refuses an unknown provider, a missing name and a login or link that is not there', async () => {
    await expect(
      Mutation.saveTechProviderLogin(null, { provider: 'nope', input: LOGIN }, admin),
    ).rejects.toThrow('Provider not found');
    await expect(
      Mutation.saveTechProviderLogin(
        null,
        { provider: 'openai', input: { ...LOGIN, label: ' ' } },
        admin,
      ),
    ).rejects.toThrow('Name the account in under 120 characters.');
    const missing = '6560f1f1f1f1f1f1f1f1f1f1';
    await expect(
      Mutation.saveTechProviderLogin(
        null,
        { provider: 'openai', id: missing, input: LOGIN },
        admin,
      ),
    ).rejects.toThrow('Login not found');
    await expect(
      Query.techProviderLoginPassword(null, { provider: 'openai', id: missing }, admin),
    ).rejects.toThrow('Login not found');
    await expect(
      Mutation.saveTechProviderLink(
        null,
        {
          provider: 'openai',
          id: missing,
          input: { label: 'a', url: 'https://a.b', kind: 'OTHER' },
        },
        admin,
      ),
    ).rejects.toThrow('Link not found');
  });

  it('says there is no password for a login that signs in with Google', async () => {
    const profile = await Mutation.saveTechProviderLogin(
      null,
      { provider: 'github', input: { ...LOGIN, signInMethod: 'GOOGLE', password: '' } },
      admin,
    );
    expect(profile.logins[0].hasPassword).toBe(false);
    await expect(
      Query.techProviderLoginPassword(
        null,
        { provider: 'github', id: profile.logins[0].id },
        admin,
      ),
    ).rejects.toThrow('Password not found');
  });
});
