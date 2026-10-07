import { ensureEmailDefaults } from '../../../../src/modules/email';
import { EmailFragmentModel } from '../../../../src/modules/email/email-fragment.model';
import { EmailTemplateModel } from '../../../../src/modules/email/email-template.model';
import { fragmentsIn } from '../../../../src/modules/email/email.render';
import { logger } from '../../../../src/utils/logger';

/** The "Pay now" button the overdue chase gained after it was first seeded. */
const PAY_BUTTON = /^ {8}<mj-button[^\n]*>Pay now<\/mj-button>\n/m;

let info: jest.SpyInstance;

beforeEach(() => {
  info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

const overdue = async () =>
  (await EmailTemplateModel.findOne({ key: 'invoice-overdue' }).lean())?.mjml ?? '';

describe('ensureEmailDefaults', () => {
  it('seeds the fragments and every template code sends by, all active', async () => {
    await ensureEmailDefaults();

    const fragments = await EmailFragmentModel.find().lean();
    expect(fragments.map((row) => row.key).sort((a, b) => a.localeCompare(b))).toEqual([
      'footer',
      'header',
    ]);
    const templates = await EmailTemplateModel.find().lean();
    const keys = new Set(templates.map((row) => row.key));
    for (const key of ['salary-slip', 'password-reset', 'invoice-overdue', 'notification']) {
      expect(keys.has(key)).toBe(true);
    }
    expect(templates.every((row) => row.isActive)).toBe(true);
    expect(info).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(String.raw`^Seeded ${fragments.length + templates.length} email`),
      ),
    );
  });

  it('only includes fragments that exist', async () => {
    await ensureEmailDefaults();
    const known = new Set((await EmailFragmentModel.find().lean()).map((row) => row.key));
    const templates = await EmailTemplateModel.find().lean();
    const used = templates.flatMap((row) => fragmentsIn(row.mjml));
    expect(used.length).toBeGreaterThan(0);
    expect(used.every((key) => known.has(key))).toBe(true);
  });

  it('never overwrites an edit, and says nothing when there is nothing to do', async () => {
    await ensureEmailDefaults();
    await EmailTemplateModel.updateOne({ key: 'salary-slip' }, { subject: 'Edited by HR' });
    info.mockClear();

    await ensureEmailDefaults();

    const edited = await EmailTemplateModel.findOne({ key: 'salary-slip' }).lean();
    expect(edited?.subject).toBe('Edited by HR');
    expect(info).not.toHaveBeenCalled();
  });

  it('gives an untouched first version of the overdue chase its pay link', async () => {
    await ensureEmailDefaults();
    const current = await overdue();
    expect(current).toMatch(PAY_BUTTON);
    const firstVersion = current.replace(PAY_BUTTON, '');
    await EmailTemplateModel.updateOne({ key: 'invoice-overdue' }, { mjml: firstVersion });
    info.mockClear();

    await ensureEmailDefaults();

    expect(await overdue()).toBe(current);
    expect(info).toHaveBeenCalledWith('Seeded 0 email fragment(s)/template(s), upgraded 1');
  });

  it('leaves an edited overdue chase without the link alone', async () => {
    await ensureEmailDefaults();
    const edited = (await overdue()).replace(PAY_BUTTON, '').replace('is overdue', 'is late');
    await EmailTemplateModel.updateOne({ key: 'invoice-overdue' }, { mjml: edited });

    await ensureEmailDefaults();

    expect(await overdue()).toBe(edited);
  });
});
