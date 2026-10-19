import { Types } from 'mongoose';
import { env } from '../../../../src/config/env';
import { sha256 } from '../../../../src/modules/auth/google/google-sign-in.oauth';
import { open } from '../../../../src/utils/secretBox';
import {
  finishMicrosoftConnect,
  presentMicrosoftConfig,
  readMicrosoftConfig,
  saveMicrosoftConfig,
  startMicrosoftConnect,
  takeMicrosoftState,
  testMicrosoftMail,
} from '../../../../src/modules/microsoft-mail/microsoft.connect';
import {
  MicrosoftMailAccountModel,
  MicrosoftMailConfigModel,
  MicrosoftOAuthStateModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';
import { codeOf } from '../codeOf';
import { APP_SECRET, connectMailbox, fakeMicrosoft, saveApp } from './fakeMicrosoft';

const SALES = 'sales@contoso.test';
const FOUNDER = 'founder@contoso.test';
const PORTAL = `${env.corsOrigins[0]}/crm/integrations`;
const REDIRECT_URI = `${env.apiPublicUrl}/oauth/microsoft/callback`;
const actor = (organizationId: string | null = new Types.ObjectId().toHexString()) => ({
  id: 'u1',
  name: 'Ravi',
  organizationId,
});
const configInput = (fields: Record<string, unknown> = {}) => ({
  clientId: ' ms-client-id ',
  clientSecret: APP_SECRET,
  tenant: 'contoso.com',
  enabled: true,
  ...fields,
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the Entra app config (Tech)', () => {
  it('starts as one blank, turned-off row, created on first read', async () => {
    const first = await readMicrosoftConfig();
    await readMicrosoftConfig();

    expect(first).toMatchObject({ key: 'default', clientId: '', enabled: false });
    expect(await MicrosoftMailConfigModel.countDocuments()).toBe(1);
  });

  it('shows Tech whether a secret is stored, never the secret, with the redirect to register', async () => {
    await connectMailbox(SALES);
    const blank = await presentMicrosoftConfig(await readMicrosoftConfig());

    expect(blank).toMatchObject({
      id: 'default',
      tenant: 'common',
      hasClientSecret: false,
      clientSecretHint: null,
      accountCount: 1,
      redirectUri: REDIRECT_URI,
    });

    await MicrosoftMailConfigModel.updateOne(
      { key: 'default' },
      { clientSecret: APP_SECRET, tenant: '' },
    );
    const shown = await presentMicrosoftConfig(await readMicrosoftConfig());
    expect(shown).toMatchObject({
      tenant: 'common',
      hasClientSecret: true,
      clientSecretHint: APP_SECRET.slice(-4),
    });
    expect(JSON.stringify(shown)).not.toContain(APP_SECRET);
  });

  it('saves a trimmed app, even before it was ever read', async () => {
    const saved = await saveMicrosoftConfig(configInput(), 'Ravi');

    expect(saved).toMatchObject({
      key: 'default',
      clientId: 'ms-client-id',
      clientSecret: APP_SECRET,
      tenant: 'contoso.com',
      enabled: true,
      updatedByName: 'Ravi',
    });
    expect(await MicrosoftMailConfigModel.countDocuments()).toBe(1);
  });

  it('keeps the stored secret when the edit leaves it blank, and a blank tenant means common', async () => {
    await saveMicrosoftConfig(configInput(), 'Ravi');

    const saved = await saveMicrosoftConfig(
      configInput({ clientSecret: '  ', tenant: ' ', enabled: false }),
      'Meera',
    );

    expect(saved).toMatchObject({ clientSecret: APP_SECRET, tenant: 'common', enabled: false });
  });

  it('refuses a tenant that is not a name, an id or a domain', async () => {
    await expect(
      codeOf(saveMicrosoftConfig(configInput({ tenant: 'contoso.com/../x' }), 'Ravi')),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await MicrosoftMailConfigModel.countDocuments()).toBe(0);
  });
});

describe('connecting a mailbox', () => {
  it("sends the person to Microsoft's consent page with PKCE, remembering who asked", async () => {
    await saveApp({ tenant: 'contoso.com' });
    const organizationId = new Types.ObjectId().toHexString();

    const url = new URL(await startMicrosoftConnect(PORTAL, actor(organizationId)));

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://login.microsoftonline.com/contoso.com/oauth2/v2.0/authorize',
    );
    const state = await MicrosoftOAuthStateModel.findOne().lean();
    expect(state).toMatchObject({ returnTo: PORTAL, actorId: 'u1', actorName: 'Ravi', organizationId });
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'ms-client-id',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      response_mode: 'query',
      scope: 'offline_access Mail.Send User.Read',
      state: state?.nonce,
      code_challenge: sha256(state?.codeVerifier ?? ''),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
  });

  it('only comes back to a portal address', async () => {
    await saveApp();

    await expect(
      codeOf(startMicrosoftConnect('https://evil.example.test/steal', actor())),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await MicrosoftOAuthStateModel.countDocuments()).toBe(0);
  });

  it('cannot start before Tech has set the app up', async () => {
    await expect(startMicrosoftConnect(PORTAL, actor())).rejects.toThrow(
      'Microsoft mail is not set up.',
    );
  });

  it('a connection in progress can be taken only once', async () => {
    await saveApp();
    await startMicrosoftConnect(PORTAL, actor(null));
    const { nonce } = (await MicrosoftOAuthStateModel.findOne().lean()) ?? { nonce: '' };

    await expect(takeMicrosoftState(nonce)).resolves.toMatchObject({ returnTo: PORTAL });
    await expect(takeMicrosoftState(nonce)).resolves.toBeNull();
  });

  it('trades the code and keeps the sealed refresh token on the mailbox row', async () => {
    await saveApp();
    const microsoft = fakeMicrosoft({ [SALES]: {} });

    const email = await finishMicrosoftConnect(
      { codeVerifier: 'verifier-1', actorName: 'Ravi' },
      `code-${SALES}`,
    );

    expect(email).toBe(SALES);
    expect(microsoft.tokens[0].form).toMatchObject({
      grant_type: 'authorization_code',
      code: `code-${SALES}`,
      code_verifier: 'verifier-1',
      redirect_uri: REDIRECT_URI,
    });
    const account = await MicrosoftMailAccountModel.findOne({ email: SALES }).lean();
    expect(account?.connectedByName).toBe('Ravi');
    expect(open(account?.refreshToken ?? '')).toBe(`refresh-${SALES}`);
  });

  it('names nobody for a connection whose state predates the actor name', async () => {
    await saveApp();
    fakeMicrosoft({ [SALES]: {} });

    await MicrosoftOAuthStateModel.collection.insertOne({
      nonce: 'old-nonce',
      codeVerifier: 'v',
      returnTo: PORTAL,
      createdAt: new Date(),
    });
    const state = await takeMicrosoftState('old-nonce');
    expect(state).not.toBeNull();
    if (!state) return;

    await finishMicrosoftConnect(state, `code-${SALES}`);

    const account = await MicrosoftMailAccountModel.findOne({ email: SALES }).lean();
    expect(account?.connectedByName).toBe('');
  });

  it('refuses a grant without offline access', async () => {
    await saveApp();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'at' }), { status: 200 }));

    await expect(
      finishMicrosoftConnect({ codeVerifier: 'v', actorName: 'Ravi' }, 'code-x'),
    ).rejects.toThrow('Microsoft did not grant offline access.');
    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(0);
  });
});

describe('testMicrosoftMail', () => {
  it('asks for a mailbox first when none is connected', async () => {
    await saveApp();

    await expect(codeOf(testMicrosoftMail())).resolves.toBe('BAD_USER_INPUT');
  });

  it('proves each enabled mailbox, and records which work and which need a reconnect', async () => {
    await saveApp();
    const salesId = await connectMailbox(SALES);
    const founderId = await connectMailbox(FOUNDER);
    fakeMicrosoft({ [SALES]: { rotateTo: 'rt-rotated' }, [FOUNDER]: { revoked: true } });

    const report = await testMicrosoftMail();

    expect(report).toMatch(/^Microsoft answered for /);
    expect(report).toContain(`${SALES}: ok`);
    expect(report).toContain(`${FOUNDER}: Microsoft refused the stored connection.`);
    const sales = await MicrosoftMailAccountModel.findById(salesId).lean();
    expect(open(sales?.refreshToken ?? '')).toBe('rt-rotated');
    const founder = await MicrosoftMailAccountModel.findById(founderId).lean();
    expect(founder?.status).toBe('NEEDS_RECONNECT');
  });

  it('reports a mailbox Microsoft never answered for', async () => {
    await saveApp();
    const salesId = await connectMailbox(SALES);
    jest.spyOn(globalThis, 'fetch').mockRejectedValue({ code: 'ECONNRESET' });

    await expect(testMicrosoftMail()).resolves.toBe(`Microsoft answered for ${SALES}: no answer.`);
    const sales = await MicrosoftMailAccountModel.findById(salesId).lean();
    expect(sales).toMatchObject({ status: 'CONNECTED', lastError: 'No answer.' });
  });
});
