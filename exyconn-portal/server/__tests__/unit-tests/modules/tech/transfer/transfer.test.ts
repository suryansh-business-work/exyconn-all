import { techTransferResolvers } from '../../../../../src/modules/tech/transfer/transfer.resolvers';
import { TRANSFER_KINDS } from '../../../../../src/modules/tech/transfer/transfer.registry';
import { providerProfileService } from '../../../../../src/modules/tech/providers/provider-profile.service';
import { EmailConfigModel } from '../../../../../src/modules/tech/email-config.model';
import { StripeConfigModel } from '../../../../../src/modules/clienthub/payments/gateway.model';
import { MicrosoftMailConfigModel } from '../../../../../src/modules/microsoft-mail/microsoft.models';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { open, seal } from '../../../../../src/utils/secretBox';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const admin: GraphQLContext = {
  user: { id: 'u1', email: 'tech@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};
const { Query, Mutation } = techTransferResolvers;

async function seedConfigs() {
  await runAsPlatform(async () => {
    await EmailConfigModel.create({
      label: 'Main SMTP', host: 'smtp.x.com', port: 465, secure: true, username: 'u',
      password: 'smtp-pass', fromAddress: 'a@x.com', isActive: true,
    }); // prettier-ignore
    await StripeConfigModel.create({
      label: 'Live', secretKey: seal('sk_live_abc123456'), secretKeyHint: '3456',
      webhookSecret: seal('whsec_zz99xx'), webhookSecretHint: '99xx', isActive: true,
    }); // prettier-ignore
  });
  await providerProfileService.saveLogin('stripe', null, {
    label: 'Owner', username: 'o@x.com', signInMethod: 'EMAIL_PASSWORD', password: 'pw1', notes: '',
  }); // prettier-ignore
}

const exportAll = async () => JSON.parse(await Query.exportTechConfigs(null, {}, admin));

const wipe = () =>
  runAsPlatform(async () => {
    await EmailConfigModel.deleteMany({});
    await StripeConfigModel.deleteMany({});
  });

describe('the transfer registry', () => {
  it('knows every config kind and the section it belongs to', () => {
    const sections = [...TRANSFER_KINDS.values()].map((kind) => kind.section);
    expect(sections).not.toContain('other');
    expect(TRANSFER_KINDS.get('StripeConfig')?.secrets).toEqual(
      expect.arrayContaining([{ field: 'secretKey', sealed: true }]),
    );
    expect(TRANSFER_KINDS.get('FirecrawlConfig')?.secrets).toEqual([
      { field: 'apiKey', sealed: false },
    ]);
  });
});

describe('exporting Environment Variables as JSON', () => {
  it('opens every secret, leaves hints and bookkeeping out, and logs the export', async () => {
    await seedConfigs();
    const file = await exportAll();

    expect(file).toMatchObject({
      format: 'exyconn-environment-variables',
      version: 1,
      section: 'all',
    });
    const stripe = file.items.find((item: { kind: string }) => item.kind === 'StripeConfig');
    expect(stripe.data).toMatchObject({ label: 'Live', secretKey: 'sk_live_abc123456' });
    expect(stripe.data).not.toHaveProperty('secretKeyHint');
    expect(stripe.data).not.toHaveProperty('_id');
    expect(file.profiles[0].logins[0].password).toBe('pw1');

    const [log] = await runAsPlatform(() => AuditLogModel.find().lean());
    expect(log.summary).toBe('Exported 2 config(s) from every section as JSON, secrets included');
  });

  it('exports one section, or one config by its id', async () => {
    await seedConfigs();
    const items = await Query.techConfigItems(null, { section: 'stripe' }, admin);
    expect(items).toEqual([expect.objectContaining({ kind: 'StripeConfig', label: 'Live' })]);

    const section = JSON.parse(await Query.exportTechConfigs(null, { section: 'smtp' }, admin));
    expect(section.items.map((item: { kind: string }) => item.kind)).toEqual(['EmailConfig']);
    const one = JSON.parse(
      await Query.exportTechConfigs(null, { section: 'stripe', ids: [items[0].id] }, admin),
    );
    expect(one.items).toHaveLength(1);
  });
});

describe('importing a JSON export', () => {
  it('restores configs switched off, reseals secrets with fresh hints and merges logins', async () => {
    await seedConfigs();
    const file = await exportAll();
    await wipe();

    const result = await Mutation.importTechConfigs(null, { json: JSON.stringify(file) }, admin);

    // The two configs; the login is still on file, so it is not added a second time.
    expect(result).toEqual({ created: 2, updated: 0, skipped: 0, messages: [] });
    const stripe = await runAsPlatform(() =>
      StripeConfigModel.findOne().select('+secretKey').lean(),
    );
    expect(stripe?.secretKey).toMatch(/^v1\./);
    expect(open(String(stripe?.secretKey))).toBe('sk_live_abc123456');
    expect(stripe).toMatchObject({ secretKeyHint: '3456', isActive: false });
    const smtp = await runAsPlatform(() => EmailConfigModel.findOne().lean());
    expect(smtp).toMatchObject({ password: 'smtp-pass', isActive: false });
  });

  it('updates a single config in place, keeping its switch', async () => {
    await runAsPlatform(() =>
      MicrosoftMailConfigModel.create({
        key: 'default',
        clientId: 'old',
        clientSecret: 'x',
        enabled: true,
      }),
    );
    const file = {
      format: 'exyconn-environment-variables',
      version: 1,
      items: [
        {
          kind: 'MicrosoftMailConfig',
          data: {
            key: 'default',
            clientId: 'new-app',
            clientSecret: 's2',
            tenant: 'common',
            enabled: false,
          },
        },
      ],
    };

    const result = await Mutation.importTechConfigs(null, { json: JSON.stringify(file) }, admin);

    expect(result.updated).toBe(1);
    const row = await runAsPlatform(() => MicrosoftMailConfigModel.findOne().lean());
    expect(row).toMatchObject({ clientId: 'new-app', clientSecret: 's2', enabled: true });
  });

  it('skips what does not belong to the section, and says why', async () => {
    await seedConfigs();
    const file = await exportAll();

    const result = await Mutation.importTechConfigs(
      null,
      { section: 'smtp', json: JSON.stringify(file) },
      admin,
    );

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.messages).toEqual(['Skipped StripeConfig Live: it does not belong here.']);
  });

  it('skips an item the model refuses, keeping the rest', async () => {
    const file = {
      format: 'exyconn-environment-variables',
      version: 1,
      items: [
        { kind: 'EmailConfig', data: { label: 'No host' } },
        { kind: 'NotAThing', data: {} },
      ],
    };
    const result = await Mutation.importTechConfigs(null, { json: JSON.stringify(file) }, admin);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.messages[0]).toMatch(/^Skipped EmailConfig No host: /);
  });

  it('refuses a file that is not an export, or not JSON at all', async () => {
    await expect(
      Mutation.importTechConfigs(null, { json: '{"format":"x"}' }, admin),
    ).rejects.toThrow('That file is not an Environment Variables export (format version 1).');
    await expect(Mutation.importTechConfigs(null, { json: 'not json' }, admin)).rejects.toThrow(
      'That file is not valid JSON.',
    );
    await expect(
      Mutation.importTechConfigs(null, { json: 'x'.repeat(2 * 1024 * 1024 + 1) }, admin),
    ).rejects.toThrow('That file is too large to be an Environment Variables export.');
  });

  it('adds logins and links a provider lacks, without duplicating ones it has', async () => {
    const profiles = [
      {
        provider: 'stripe',
        logins: [{ label: 'Billing', username: 'b@x.com', signInMethod: 'GOOGLE', password: '' }],
        links: [
          { label: 'Runbook', url: 'https://wiki.x/stripe', kind: 'DOCS' },
          { label: 'Bad', url: 'javascript:alert(1)', kind: 'DOCS' },
        ],
      },
      { provider: 'not-a-provider', logins: [{ label: 'x' }] },
    ];
    const file = { format: 'exyconn-environment-variables', version: 1, items: [], profiles };

    const first = await Mutation.importTechConfigs(null, { json: JSON.stringify(file) }, admin);
    const again = await Mutation.importTechConfigs(null, { json: JSON.stringify(file) }, admin);

    expect(first.created).toBe(2);
    expect(again.created).toBe(0);
  });
});
