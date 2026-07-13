import type { Role } from '../constants/roles';
import { mjmlShell, ctaButton, credentialBlock } from './layout.template';

export interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  appUrl: string;
}

/** Converts a role identifier (e.g. "HR") into a display label (e.g. "Hr"). */
function roleLabel(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

/** Renders the assigned roles as a row of MJML chips. */
function roleChips(roles: Role[]): string {
  return roles
    .map(
      (role) =>
        `<span style="display:inline-block;background:#eef1f8;color:#155dfc;border-radius:999px;padding:6px 14px;margin:0 6px 6px 0;font-size:13px;font-weight:600;">${roleLabel(
          role,
        )}</span>`,
    )
    .join('');
}

/**
 * Builds the MJML markup for the welcome email. Every value is injected from the
 * caller — no business data is hardcoded.
 */
export function welcomeTemplate(data: WelcomeEmailData): string {
  const { name, email, password, roles, appUrl } = data;
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px">Hi ${name},</mj-text>
    <mj-text font-size="15px" color="#334155" line-height="24px">
      An account has been created for you. You have been assigned the following role(s):
    </mj-text>
    <mj-text>${roleChips(roles)}</mj-text>
    <mj-divider border-color="#e2e8f0" />
    ${credentialBlock('Username', email)}
    ${credentialBlock('Temporary password', password)}
    ${ctaButton('Sign in to the portal', appUrl)}
    <mj-text font-size="13px" color="#94a3b8" align="center">
      For your security, please change this password after your first sign-in from Settings.
    </mj-text>`;
  return mjmlShell('Welcome to Exyconn Portal', body);
}
