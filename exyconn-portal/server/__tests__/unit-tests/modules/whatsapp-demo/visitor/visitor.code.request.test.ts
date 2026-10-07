import {
  requestVisitorCode,
  type VisitorCodeInput,
} from '../../../../../src/modules/whatsapp-demo/visitor/visitor.code';
import { WhatsappDemoVisitorModel } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.model';
import { emailer } from '../../../../../src/modules/email/email.service';
import { env } from '../../../../../src/config/env';
import { logger } from '../../../../../src/utils/logger';
import { codeOf } from '../../codeOf';
import { solvedCaptcha } from '../../../../helpers';
import { seedVisitor, useOperatorOrganization, withoutOperator } from './visitor.fixtures';

const operatorId = useOperatorOrganization();
const IP = 'test-network';
const EMAIL = 'dana@acme.test';

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

const input = (overrides: Partial<VisitorCodeInput> = {}): VisitorCodeInput => ({
  name: '  Dana Reyes ',
  email: ' Dana@Acme.TEST ',
  company: 'Acme',
  phone: '+91 98000 00001',
  source: 'DEMO_LOGIN',
  ...overrides,
});

describe('requestVisitorCode: who may ask', () => {
  const refusals: Array<[Partial<VisitorCodeInput>, string]> = [
    [{ name: '   ' }, 'Enter your name.'],
    [{ name: 'x'.repeat(121) }, 'Enter your name.'],
    [{ name: 'Visit www.example' }, 'Enter your name without links or email addresses.'],
    [{ name: 'me@spam' }, 'Enter your name without links or email addresses.'],
    [{ name: 'Buy at shop.com now' }, 'Enter your name without links or email addresses.'],
    [{ email: 'not-an-address' }, 'Enter a valid email address.'],
    [{ company: 'c'.repeat(121) }, 'Keep the company name under 120 characters.'],
    [{ phone: 'call me' }, 'Enter a valid phone number.'],
  ];

  it.each(refusals)('refuses %j', async (overrides, message) => {
    await expect(requestVisitorCode(input(overrides), IP, null)).rejects.toThrow(message);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses while no company operates the live demo', async () => {
    await withoutOperator(operatorId);

    await expect(requestVisitorCode(input(), IP, null)).rejects.toThrow(
      'The live demo is not available yet.',
    );
  });

  it('allows five codes an hour for one address', async () => {
    for (let i = 0; i < 5; i += 1) {
      await requestVisitorCode(input(), `${IP}-${i}`, null);
    }

    expect(await codeOf(requestVisitorCode(input(), `${IP}-6`, null))).toBe('TOO_MANY_REQUESTS');
  });

  it('checks the website security question when the website asks', async () => {
    await expect(requestVisitorCode(input(), IP, solvedCaptcha())).resolves.toBe(true);

    const wrong = { ...solvedCaptcha(), answer: '-1' };
    expect(await codeOf(requestVisitorCode(input(), IP, wrong))).toBe('CAPTCHA_FAILED');
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('requestVisitorCode: filing the lead and sending the code', () => {
  it('files the visitor and emails a fresh sign-in code', async () => {
    await expect(requestVisitorCode(input(), IP, null)).resolves.toBe(true);

    const visitor = await WhatsappDemoVisitorModel.findOne({ email: EMAIL }).lean();
    expect(visitor).toEqual(
      expect.objectContaining({
        name: 'Dana Reyes',
        company: 'Acme',
        phone: '+91 98000 00001',
        source: 'DEMO_LOGIN',
        verifiedAt: null,
      }),
    );
    expect(send).toHaveBeenCalledWith({
      template: 'whatsapp-demo-code',
      to: EMAIL,
      variables: {
        name: 'Dana Reyes',
        code: expect.stringMatching(/^\d{6}$/),
        expiresIn: '10 minutes',
        demoUrl: env.whatsappDemoUrl,
      },
      triggeredBy: 'WhatsApp demo sign-in',
    });
  });

  it('updates a returning visitor, keeping details left blank and where they came from', async () => {
    await seedVisitor({ source: 'WEBSITE' });

    await requestVisitorCode(input({ name: 'Dana R', company: ' ', phone: null }), IP, null);

    const visitors = await WhatsappDemoVisitorModel.find().lean();
    expect(visitors).toHaveLength(1);
    expect(visitors[0]).toEqual(
      expect.objectContaining({
        name: 'Dana R',
        company: 'Acme',
        phone: '+91 98000 00001',
        source: 'WEBSITE',
      }),
    );
  });

  it('tells a blocked visitor the same as anybody, and sends nothing', async () => {
    await seedVisitor({ blocked: true });

    await expect(requestVisitorCode(input(), IP, null)).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it('asks the visitor to try again when the email cannot be sent', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(requestVisitorCode(input(), IP, null)).rejects.toThrow(
      'We could not send the code just now. Try again in a minute.',
    );
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'WhatsApp demo code email failed',
    );
  });
});
