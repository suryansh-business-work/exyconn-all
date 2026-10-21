import { LIMITS } from '@exyconn/gcc-cost';
import { gccResolvers } from '../../../../src/modules/gcc';
import { emailer, renderStoredTemplate } from '../../../../src/modules/email/email.service';
import { ensureEmailDefaults } from '../../../../src/modules/email/email.defaults';
import { RawHtml, rawHtml } from '../../../../src/modules/email/email.render';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { OrganizationModel } from '../../../../src/modules/organizations';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { solvedCaptcha } from '../../../helpers';
import { seedPlatformOperator } from '../../security-authz.operator';
import { codeOf } from '../codeOf';
import { gccEstimate, gccEstimateJson } from './gcc.fixtures';
import { pdfFileName } from '../../../../src/modules/gcc/gcc.email';

const visitor: GraphQLContext = { user: null, ip: '198.51.100.40' };

const email = (input: { to: string; estimateJson: string; note?: string }) =>
  gccResolvers.Mutation.emailGccEstimate(null, { input, captcha: solvedCaptcha() }, visitor);

describe('emailing a GCC estimate', () => {
  let send: jest.SpyInstance;

  beforeEach(async () => {
    await seedPlatformOperator();
    send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  });

  afterEach(() => {
    send.mockRestore();
  });

  it('sends a PDF of the figures the server recomputed, and says where it went', async () => {
    const result = await email({
      to: ' Dana@Globex.com ',
      estimateJson: gccEstimateJson(),
      note: 'For <Monday>',
    });

    expect(result).toEqual({ sentTo: 'dana@globex.com' });
    const [message] = send.mock.calls[0];
    expect(message).toMatchObject({
      template: 'gcc-estimate',
      to: 'dana@globex.com',
      variables: { estimateName: 'Pune GCC', note: 'For <Monday>' },
    });
    const [attachment] = message.attachments;
    expect(attachment.filename).toBe('pune-gcc.pdf');
    expect(attachment.content.subarray(0, 5).toString()).toBe('%PDF-');
    const summary = message.variables.summary as RawHtml;
    expect(summary).toBeInstanceOf(RawHtml);
    // Ten engineers at INR 12 lakh a year: INR 1,20,00,000 over the 12-month forecast.
    expect(summary.html).toContain('INR');
    expect(summary.html).toContain('1,20,00,000');
  });

  it('escapes what the visitor wrote before it reaches the email body', async () => {
    await email({
      to: 'dana@globex.com',
      estimateJson: gccEstimateJson({ name: 'A <b>bold</b> plan' }),
    });

    const summary = send.mock.calls[0][0].variables.summary as RawHtml;
    expect(summary.html).toContain('A &lt;b&gt;bold&lt;/b&gt; plan');
    expect(summary.html).not.toContain('<b>');
  });

  it('claims nothing when the email service fails', async () => {
    send.mockRejectedValue(new Error('SMTP refused dana@globex.com'));

    expect(await codeOf(email({ to: 'dana@globex.com', estimateJson: gccEstimateJson() }))).toBe(
      'EMAIL_UNAVAILABLE',
    );
  });

  it('is unavailable while no organization operates the platform', async () => {
    await OrganizationModel.updateMany({}, { isPlatformOperator: false });
    invalidatePlatformOperatorCache();

    expect(await codeOf(email({ to: 'dana@globex.com', estimateJson: gccEstimateJson() }))).toBe(
      'EMAIL_UNAVAILABLE',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    ['broken JSON', '{"schemaVersion":'],
    ['a prototype key', '{"__proto__":{"admin":true}}'],
    ['an estimate that fails the schema', gccEstimateJson({ name: '' })],
    ['figures the browser added', JSON.stringify({ ...gccEstimate(), totals: { forecast: 1 } })],
    ['an oversized payload', `${gccEstimateJson()}${' '.repeat(LIMITS.payloadBytes)}`],
  ])('refuses %s', async (_label, estimateJson) => {
    expect(await codeOf(email({ to: 'dana@globex.com', estimateJson }))).toBe('BAD_USER_INPUT');
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses an address that is not one', async () => {
    expect(await codeOf(email({ to: 'dana@globex', estimateJson: gccEstimateJson() }))).toBe(
      'BAD_USER_INPUT',
    );
  });

  it('refuses a wrong captcha answer', async () => {
    const { token } = solvedCaptcha();
    const call = gccResolvers.Mutation.emailGccEstimate(
      null,
      {
        input: { to: 'dana@globex.com', estimateJson: gccEstimateJson() },
        captcha: { token, answer: '999' },
      },
      visitor,
    );

    expect(await codeOf(call)).toBe('CAPTCHA_FAILED');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends one address at most three estimates a day', async () => {
    for (let sent = 0; sent < 3; sent += 1) {
      await email({ to: 'dana@globex.com', estimateJson: gccEstimateJson() });
    }

    expect(await codeOf(email({ to: 'DANA@globex.com', estimateJson: gccEstimateJson() }))).toBe(
      'TOO_MANY_REQUESTS',
    );
    expect(send).toHaveBeenCalledTimes(3);
  });
});

describe('the gcc-estimate email template', () => {
  it('is seeded, and renders the summary lines it is given', async () => {
    await ensureEmailDefaults();

    const rendered = await renderStoredTemplate('gcc-estimate', {
      estimateName: 'Pune GCC',
      note: 'For Monday',
      summary: rawHtml('Standard<br />• Forecast total: INR 1,20,00,000'),
    });

    expect(rendered.subject).toBe('GCC cost estimate: Pune GCC');
    expect(rendered.html).toContain('Standard<br />• Forecast total: INR 1,20,00,000');
    expect(rendered.html).toContain('For Monday');
  });
});

describe('pdfFileName', () => {
  it('slugs the name and trims dashes from both ends', () => {
    expect(pdfFileName('  --Pune GCC (2026)!-- ')).toBe('pune-gcc-2026.pdf');
  });

  it('falls back to a default when nothing usable is left', () => {
    expect(pdfFileName('!!! ---')).toBe('gcc-estimate.pdf');
  });

  it('cuts the slug to 60 characters before trimming a dash left at the cut', () => {
    expect(pdfFileName(`${'a'.repeat(59)} b`)).toBe(`${'a'.repeat(59)}.pdf`);
  });

  it('handles a long run of separators', () => {
    expect(pdfFileName(`x${'-'.repeat(50_000)}`)).toBe('x.pdf');
  });
});
