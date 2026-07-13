import { mjmlShell, ctaButton, credentialBlock } from './layout.template';

export interface CredentialsEmailData {
  name: string;
  email: string;
  password: string;
  appUrl: string;
}

/**
 * Builds the MJML markup sent when an administrator resets a user's password.
 * Every value is injected from the caller — no business data is hardcoded.
 */
export function credentialsTemplate(data: CredentialsEmailData): string {
  const { name, email, password, appUrl } = data;
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px">Hi ${name},</mj-text>
    <mj-text font-size="15px" color="#334155" line-height="24px">
      Your password has been reset by an administrator. Use the temporary password
      below to sign in.
    </mj-text>
    <mj-divider border-color="#e2e8f0" />
    ${credentialBlock('Username', email)}
    ${credentialBlock('Temporary password', password)}
    ${ctaButton('Sign in to the portal', appUrl)}
    <mj-text font-size="13px" color="#94a3b8" align="center">
      For your security, please change this password after your next sign-in from Settings.
    </mj-text>`;
  return mjmlShell('Your password has been reset', body);
}
