/**
 * Shared branded MJML shell for all transactional emails. Callers pass the
 * heading and the inner column markup; no business data is hardcoded here.
 */
export function mjmlShell(heading: string, bodyContent: string): string {
  return `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-all font-family="Inter, Helvetica, Arial, sans-serif" />
      </mj-attributes>
    </mj-head>
    <mj-body background-color="#eef1f8">
      <mj-section padding="32px 0 8px">
        <mj-column>
          <mj-text align="center" font-size="22px" font-weight="700" color="#0b0a12">
            ${heading}
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#ffffff" border-radius="16px" padding="32px">
        <mj-column>
          ${bodyContent}
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`;
}

/** Renders a primary CTA button linking to the portal. */
export function ctaButton(label: string, href: string): string {
  return `<mj-button background-color="#155dfc" border-radius="10px" href="${href}" padding="24px 0 8px">${label}</mj-button>`;
}

/** Renders a labelled credential block (label + emphasised value). */
export function credentialBlock(label: string, value: string): string {
  return `
    <mj-text font-size="14px" color="#64748b" padding-bottom="4px">${label}</mj-text>
    <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">${value}</mj-text>`;
}
