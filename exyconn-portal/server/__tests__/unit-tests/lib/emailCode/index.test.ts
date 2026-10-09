import { Types } from 'mongoose';
import {
  EMAIL_CODE_TTL_LABEL,
  consumeEmailCode,
  issueEmailCode,
} from '../../../../src/lib/emailCode';
import { EmailCodeModel } from '../../../../src/lib/emailCode/emailCode.model';
import { runForOrganization } from '../../../../src/lib/tenant';

const EMAIL = 'visitor@example.com';
/** A code that differs from the real one, so the guess is always wrong. */
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

afterEach(() => jest.restoreAllMocks());

describe('issueEmailCode', () => {
  it('issues a six-digit code and keeps only its hash, for ten minutes', async () => {
    const before = Date.now();
    const code = await issueEmailCode('client-hub', EMAIL);
    expect(code).toMatch(/^\d{6}$/);
    expect(EMAIL_CODE_TTL_LABEL).toBe('10 minutes');

    const [row] = await EmailCodeModel.find({ email: EMAIL }).lean();
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.codeHash).not.toContain(code);
    expect(row.attempts).toBe(0);
    expect(row.usedAt).toBeNull();
    const ttl = row.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThanOrEqual(10 * 60 * 1000 - 50);
    expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000 + 5_000);
  });

  it('spends any earlier code sent to the same address', async () => {
    await issueEmailCode('whatsapp-demo', EMAIL);
    const latest = await issueEmailCode('whatsapp-demo', EMAIL);
    const rows = await EmailCodeModel.find({ email: EMAIL }).sort({ _id: 1 }).lean();
    expect(rows).toHaveLength(2);
    expect(rows[0].usedAt).toBeInstanceOf(Date);
    expect(rows[1].usedAt).toBeNull();
    await expect(consumeEmailCode('whatsapp-demo', EMAIL, latest)).resolves.toBeUndefined();
  });
});

describe('consumeEmailCode', () => {
  it('accepts the right code once, with or without padding', async () => {
    const code = await issueEmailCode('client-hub', EMAIL);
    await expect(consumeEmailCode('client-hub', EMAIL, ` ${code} `)).resolves.toBeUndefined();
    await expect(consumeEmailCode('client-hub', EMAIL, code)).rejects.toThrow(
      'That code has expired. Ask for a new one.',
    );
  });

  it('never lets one sign-in’s code open another', async () => {
    const code = await issueEmailCode('client-hub', EMAIL);
    await expect(consumeEmailCode('website-chat', EMAIL, code)).rejects.toThrow('expired');
    await expect(consumeEmailCode('client-hub', 'other@example.com', code)).rejects.toThrow(
      'expired',
    );
  });

  it('counts a wrong guess against the code', async () => {
    const code = await issueEmailCode('website-chat', EMAIL);
    await expect(consumeEmailCode('website-chat', EMAIL, wrong(code))).rejects.toThrow(
      'That code is not right.',
    );
    const row = await EmailCodeModel.findOne({ email: EMAIL }).lean();
    expect(row?.attempts).toBe(1);
    await expect(consumeEmailCode('website-chat', EMAIL, code)).resolves.toBeUndefined();
  });

  it('retires the code after five wrong guesses, even if the sixth is right', async () => {
    const code = await issueEmailCode('website-chat', EMAIL);
    for (let guess = 0; guess < 5; guess += 1) {
      await expect(consumeEmailCode('website-chat', EMAIL, wrong(code))).rejects.toThrow(
        'not right',
      );
    }
    await expect(consumeEmailCode('website-chat', EMAIL, code)).rejects.toThrow(
      'Too many wrong codes. Ask for a new one.',
    );
    await expect(consumeEmailCode('website-chat', EMAIL, code)).rejects.toThrow('expired');
  });

  it('refuses a code past its time', async () => {
    const code = await issueEmailCode('client-hub', EMAIL);
    await EmailCodeModel.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    await expect(consumeEmailCode('client-hub', EMAIL, code)).rejects.toThrow('expired');
  });

  it('refuses a code another request spent at the same moment', async () => {
    const code = await issueEmailCode('client-hub', EMAIL);
    jest.spyOn(EmailCodeModel, 'findOneAndUpdate').mockResolvedValueOnce(null);
    await expect(consumeEmailCode('client-hub', EMAIL, code)).rejects.toThrow(
      'That code has already been used. Ask for a new one.',
    );
  });

  it('keeps each company’s codes to itself', async () => {
    const company = new Types.ObjectId().toHexString();
    const elsewhere = new Types.ObjectId().toHexString();
    const code = await runForOrganization(company, () => issueEmailCode('client-hub', EMAIL));
    await expect(
      runForOrganization(elsewhere, () => consumeEmailCode('client-hub', EMAIL, code)),
    ).rejects.toThrow('expired');
    await expect(
      runForOrganization(company, () => consumeEmailCode('client-hub', EMAIL, code)),
    ).resolves.toBeUndefined();
  });
});
