import { randomUUID } from 'node:crypto';
import { credentialBlock, ctaButton, mjmlShell } from '../../../src/templates/layout.template';
import { credentialsTemplate } from '../../../src/templates/credentials.template';
import { customTemplate } from '../../../src/templates/custom.template';
import { formSubmissionTemplate } from '../../../src/templates/form-submission.template';
import { trackerAccessTemplate } from '../../../src/templates/tracker-access.template';
import { welcomeTemplate } from '../../../src/templates/welcome.template';
import { ROLES } from '../../../src/constants/roles';

const APP_URL = 'https://portal.example.test';
/** Generated, so no credential lives in the test. */
const password = randomUUID();

describe('layout', () => {
  it('wraps the body in the branded shell under its heading', () => {
    const mjml = mjmlShell('Hello there', '<mj-text>Body</mj-text>');

    expect(mjml.trim().startsWith('<mjml>')).toBe(true);
    expect(mjml).toContain('Hello there');
    expect(mjml).toContain('<mj-text>Body</mj-text>');
    expect(mjml.indexOf('Hello there')).toBeLessThan(mjml.indexOf('<mj-text>Body</mj-text>'));
  });

  it('renders a call-to-action button and a labelled credential', () => {
    expect(ctaButton('Open', APP_URL)).toContain(`href="${APP_URL}"`);
    expect(ctaButton('Open', APP_URL)).toContain('>Open</mj-button>');
    const block = credentialBlock('Username', 'dana@acme.test');
    expect(block).toContain('>Username</mj-text>');
    expect(block).toContain('>dana@acme.test</mj-text>');
  });
});

describe('account emails', () => {
  it('welcomes a new user with their roles, credentials and the sign-in link', () => {
    const mjml = welcomeTemplate({
      name: 'Dana',
      email: 'dana@acme.test',
      password,
      roles: [ROLES.HR, ROLES.SUPER_ADMIN],
      appUrl: APP_URL,
    });

    expect(mjml).toContain('Welcome to Exyconn Portal');
    expect(mjml).toContain('Hi Dana,');
    expect(mjml).toContain('>Hr</span>');
    expect(mjml).toContain('>Super_admin</span>');
    expect(mjml).toContain(`>${password}</mj-text>`);
    expect(mjml).toContain(`href="${APP_URL}"`);
  });

  it('sends the temporary password after an administrator reset', () => {
    const mjml = credentialsTemplate({
      name: 'Dana',
      email: 'dana@acme.test',
      password,
      appUrl: APP_URL,
    });

    expect(mjml).toContain('Your password has been reset');
    expect(mjml).toContain('>dana@acme.test</mj-text>');
    expect(mjml).toContain(`>${password}</mj-text>`);
  });

  it('tells an employee what the tracker records before they install it', () => {
    const mjml = trackerAccessTemplate({ name: 'Dana', downloadUrl: `${APP_URL}/download` });

    expect(mjml).toContain('Start tracking your work');
    expect(mjml).toContain('Periodic screenshots of your screen');
    expect(mjml).toContain(`href="${APP_URL}/download"`);
  });
});

describe('customTemplate', () => {
  it('turns blank-line separated text into paragraphs and line breaks', () => {
    const mjml = customTemplate({ name: 'Dana', subject: 'Update', message: 'One\nline\n\nTwo' });

    expect(mjml).toContain('>One<br />line</mj-text>');
    expect(mjml).toContain('>Two</mj-text>');
  });

  it('never lets the message, name or subject become markup', () => {
    const mjml = customTemplate({
      name: '<b>Dana</b>',
      subject: 'A & B <i>',
      message: '<script>alert(1)</script> & more',
    });

    expect(mjml).not.toContain('<script>');
    expect(mjml).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; more');
    expect(mjml).toContain('Hi &lt;b&gt;Dana&lt;/b&gt;,');
    expect(mjml).toContain('A &amp; B &lt;i&gt;');
  });
});

describe('formSubmissionTemplate', () => {
  it('lists every submitted field under a readable label', () => {
    const mjml = formSubmissionTemplate({
      formType: 'india-offer',
      submissionData: {
        firstName: 'Dana',
        company_size: 12,
        budget: { min: 1, max: 2 },
        message: 'Line one\nLine two',
      },
    });

    expect(mjml).toContain('New India offer submission');
    expect(mjml).toContain('<strong>india-offer</strong>');
    expect(mjml).toContain('>First name</mj-text>');
    expect(mjml).toContain('>Company size</mj-text>');
    expect(mjml).toContain('>12</mj-text>');
    expect(mjml).toContain('{&quot;min&quot;:1,&quot;max&quot;:2}');
    expect(mjml).toContain('Line one<br />Line two');
  });

  it('leaves out empty fields and escapes what a visitor typed', () => {
    const mjml = formSubmissionTemplate({
      formType: 'contact',
      submissionData: { empty: '', missing: null, gone: undefined, 'note"': '<img src=x>' },
    });

    expect(mjml).not.toContain('>Empty</mj-text>');
    expect(mjml).not.toContain('>Missing</mj-text>');
    expect(mjml).not.toContain('>Gone</mj-text>');
    expect(mjml).toContain('&lt;img src=x&gt;');
    expect(mjml).toContain('>Note&quot;</mj-text>');
  });

  it('writes an empty list and a bare line break as they were sent', () => {
    const mjml = formSubmissionTemplate({ formType: 'contact', submissionData: { tags: [] } });

    expect(mjml).toContain('>[]</mj-text>');
    const blank = formSubmissionTemplate({ formType: 'contact', submissionData: { note: '\n' } });
    expect(blank).toContain('><br /></mj-text>');
  });
});
