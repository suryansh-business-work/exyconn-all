import mjml2html from 'mjml';
import {
  describeTemplate,
  emailer,
  renderStoredTemplate,
} from '../../../../src/modules/email/email.service';
import { EmailRenderError, rawHtml } from '../../../../src/modules/email/email.render';
import { EmailFragmentModel } from '../../../../src/modules/email/email-fragment.model';
import { EmailTemplateModel } from '../../../../src/modules/email/email-template.model';
import { BrandingModel } from '../../../../src/modules/branding/branding.model';
import { logger } from '../../../../src/utils/logger';

jest.mock('mjml', () => ({ __esModule: true, default: jest.fn() }));

const compile = mjml2html as unknown as jest.Mock;

beforeEach(async () => {
  compile.mockImplementation((markup: string) =>
    Promise.resolve({ html: `<html>${markup}</html>`, errors: [] }),
  );
  await EmailFragmentModel.create({
    key: 'footer',
    name: 'Footer',
    mjml: '<mj-text>{{companyName}} · {{supportEmail}} · {{unsubscribe}}</mj-text>',
  });
  await EmailTemplateModel.create({
    key: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to {{companyName}}, {{name}}',
    mjml: '<mj-text>Hi {{name}}</mj-text>{{> footer }}',
  });
});

afterEach(() => jest.restoreAllMocks());

describe('renderStoredTemplate', () => {
  it('refuses a key with no template', async () => {
    await expect(renderStoredTemplate('nope', {})).rejects.toThrow(
      new EmailRenderError('No email template with the key "nope".'),
    );
  });

  it('fills the branded defaults when no Branding is saved, and the caller wins', async () => {
    const rendered = await renderStoredTemplate('welcome', {
      name: 'Asha',
      unsubscribe: rawHtml('<a href="/u">Unsubscribe</a>'),
      supportEmail: 'help@example.com',
    });

    expect(rendered.subject).toBe('Welcome to Exyconn, Asha');
    expect(compile).toHaveBeenCalledWith(
      '<mj-text>Hi Asha</mj-text><mj-text>Exyconn · help@example.com · <a href="/u">Unsubscribe</a></mj-text>',
    );
    expect(rendered.html).toContain('<html><mj-text>Hi Asha</mj-text>');
    expect(rendered.variables).toEqual(['companyName', 'name']);
    expect(rendered.fragments).toEqual(['footer']);
  });

  it('takes the company name and contact details from Branding', async () => {
    await BrandingModel.create({
      businessName: 'Acme',
      supportEmail: 'care@acme.example',
      websiteUrl: 'https://acme.example',
    });

    const rendered = await renderStoredTemplate('welcome', { name: 'Ravi', unsubscribe: 'x' });

    expect(rendered.subject).toBe('Welcome to Acme, Ravi');
    expect(compile.mock.calls[0][0]).toContain('Acme · care@acme.example · x');
  });

  it('still returns the HTML when MJML reports problems, and logs them', async () => {
    compile.mockResolvedValue({ html: '<html>partial</html>', errors: [{ message: 'bad tag' }] });
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const rendered = await renderStoredTemplate('welcome', { name: 'Asha', unsubscribe: 'x' });

    expect(rendered.html).toBe('<html>partial</html>');
    expect(error).toHaveBeenCalledWith(
      { errors: [{ message: 'bad tag' }] },
      'MJML errors while rendering "welcome"',
    );
  });

  it('refuses to render when a value the template needs is missing', async () => {
    await expect(renderStoredTemplate('welcome', { name: 'Asha' })).rejects.toThrow(
      'Missing value for: unsubscribe',
    );
    expect(compile).not.toHaveBeenCalled();
  });
});

describe('describeTemplate', () => {
  it('lists what the template and its fragments ask for, minus the branded values', async () => {
    await expect(describeTemplate('welcome')).resolves.toEqual(['name', 'unsubscribe']);
  });

  it('ignores a fragment that does not exist rather than failing the form', async () => {
    await EmailTemplateModel.create({
      key: 'orphan',
      name: 'Orphan',
      subject: 'Hello {{who}}',
      mjml: '{{> missing }}<mj-text>{{websiteUrl}}</mj-text>',
    });
    await expect(describeTemplate('orphan')).resolves.toEqual(['who']);
  });

  it('refuses a key with no template', async () => {
    await expect(describeTemplate('nope')).rejects.toThrow(
      'No email template with the key "nope".',
    );
  });
});

describe('emailer', () => {
  it('is the one surface for rendering and describing', async () => {
    expect(emailer.render).toBe(renderStoredTemplate);
    expect(emailer.describe).toBe(describeTemplate);
    await expect(emailer.describe('welcome')).resolves.toContain('name');
  });
});
