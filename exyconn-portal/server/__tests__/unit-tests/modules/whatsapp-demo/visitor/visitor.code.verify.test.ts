import {
  requestVisitorCode,
  verifyVisitorCode,
} from '../../../../../src/modules/whatsapp-demo/visitor/visitor.code';
import { WhatsappDemoVisitorModel } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.model';
import { readVisitorPass } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.token';
import { emailer } from '../../../../../src/modules/email/email.service';
import { env } from '../../../../../src/config/env';
import { codeOf } from '../../codeOf';
import { useOperatorOrganization, withoutOperator } from './visitor.fixtures';

const operatorId = useOperatorOrganization();
const EMAIL = 'dana@acme.test';

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

/** Asks for a code the way the demo sign-in does, and returns the one emailed. */
async function emailedCode(): Promise<string> {
  await requestVisitorCode(
    { name: 'Dana Reyes', email: EMAIL, source: 'DEMO_LOGIN' },
    'test-network',
    null,
  );
  return send.mock.calls.at(-1)[0].variables.code;
}

/** A six-digit code that is certainly not `code`. */
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

describe('verifyVisitorCode', () => {
  it('signs the visitor in with the emailed code and hands back a demo pass', async () => {
    const code = await emailedCode();

    const signIn = await verifyVisitorCode('  Dana@Acme.TEST ', code);

    const visitor = await WhatsappDemoVisitorModel.findOne({ email: EMAIL }).lean();
    expect(readVisitorPass(signIn.token)).toEqual({ vid: String(visitor?._id), tv: 0 });
    expect(signIn.demoUrl).toBe(env.whatsappDemoUrl);
    expect(signIn.visitor.verifiedAt).toBeInstanceOf(Date);
    expect(signIn.visitor.signInCount).toBe(1);
    expect(visitor?.verifiedAt).toEqual(signIn.visitor.verifiedAt);
    expect(visitor?.lastSignInAt).toEqual(signIn.visitor.verifiedAt);
  });

  it('keeps the first verification date on later sign-ins', async () => {
    const first = await verifyVisitorCode(EMAIL, await emailedCode());

    const second = await verifyVisitorCode(EMAIL, await emailedCode());

    expect(second.visitor.signInCount).toBe(2);
    expect(second.visitor.verifiedAt).toEqual(first.visitor.verifiedAt);
    const stored = await WhatsappDemoVisitorModel.findOne({ email: EMAIL }).lean();
    expect(stored?.lastSignInAt?.getTime()).toBeGreaterThanOrEqual(
      first.visitor.verifiedAt.getTime(),
    );
  });

  it('refuses a wrong code and counts nothing as a sign-in', async () => {
    const code = await emailedCode();

    await expect(verifyVisitorCode(EMAIL, wrong(code))).rejects.toThrow('That code is not right.');
    const visitor = await WhatsappDemoVisitorModel.findOne({ email: EMAIL }).lean();
    expect(visitor?.signInCount).toBe(0);
  });

  it('refuses a visitor blocked after the code was sent', async () => {
    const code = await emailedCode();
    await WhatsappDemoVisitorModel.updateOne({ email: EMAIL }, { blocked: true });

    await expect(verifyVisitorCode(EMAIL, code)).rejects.toThrow(
      'Demo access for this address has been switched off.',
    );
  });

  it('refuses a visitor deleted after the code was sent', async () => {
    const code = await emailedCode();
    await WhatsappDemoVisitorModel.deleteOne({ email: EMAIL });

    await expect(verifyVisitorCode(EMAIL, code)).rejects.toThrow(
      'Demo access for this address has been switched off.',
    );
  });

  it('refuses while no company operates the live demo', async () => {
    await withoutOperator(operatorId);

    await expect(verifyVisitorCode(EMAIL, '123456')).rejects.toThrow(
      'The live demo is not available yet.',
    );
  });

  it('limits guesses per address across codes', async () => {
    for (let i = 0; i < 15; i += 1) {
      await codeOf(verifyVisitorCode(EMAIL, '000000'));
    }

    expect(await codeOf(verifyVisitorCode(EMAIL, '000000'))).toBe('TOO_MANY_REQUESTS');
  });
});
