import { EmailFragmentModel } from './email-fragment.model';
import { EmailTemplateModel } from './email-template.model';
import { logger } from '../../utils/logger';

/**
 * The starting set of fragments and templates.
 *
 * These exist so the system works on a fresh install rather than failing the first time
 * something tries to send. They are seeded ONLY when absent — an edit made in the portal is
 * never overwritten on restart, because the whole point of moving email into the portal was
 * that copy stops being a deploy.
 *
 * A key referenced from code (`policy-acknowledged`) must have a template here, or that
 * feature is broken on day one for everybody who has not hand-written one.
 */
const FRAGMENTS = [
  {
    key: 'header',
    name: 'Branded header',
    description:
      'The band at the top of every email. companyName is supplied automatically from Branding.',
    mjml: `<mj-section padding="32px 0 8px">
  <mj-column>
    <mj-text align="center" font-size="18px" font-weight="700" color="#0b0a12">{{companyName}}</mj-text>
  </mj-column>
</mj-section>`,
  },
  {
    key: 'footer',
    name: 'Footer',
    description: 'Closing line and the company name. Uses {{companyName}}.',
    mjml: `<mj-section padding="8px 0 32px">
  <mj-column>
    <mj-text align="center" font-size="12px" color="#94a3b8">
      Sent by {{companyName}}. Please do not reply to this message.
    </mj-text>
  </mj-column>
</mj-section>`,
  },
];

/** Wraps body markup in the shared shell so every seeded template looks the same. */
function shell(body: string): string {
  return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Inter, Helvetica, Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#eef1f8">
    {{> header }}
    <mj-section background-color="#ffffff" border-radius="16px" padding="32px">
      <mj-column>
${body}
      </mj-column>
    </mj-section>
    {{> footer }}
  </mj-body>
</mjml>`;
}

const TEMPLATES = [
  {
    key: 'policy-acknowledged',
    name: 'Policy signed — confirmation',
    description:
      "The signer's own copy of what they agreed to and when. Sent by Legal when somebody signs a policy.",
    subject: 'You signed "{{policyTitle}}"',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Policy signed</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          This confirms that you read and signed <strong>{{policyTitle}}</strong> (version {{version}}).
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Signed as</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{signedName}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Signed at</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{signedAt}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          Keep this for your records. You can read the policy again at any time from My policies.
        </mj-text>`),
  },
  {
    key: 'policy-published',
    name: 'Policy published — please read and sign',
    description: 'Tells staff a policy needs their signature. Sent by Legal on publish.',
    subject: 'Please read and sign: {{policyTitle}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">A policy needs your signature</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          <strong>{{policyTitle}}</strong> (version {{version}}) takes effect on {{effectiveDate}} and needs your signature.
        </mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{policyUrl}}" padding="24px 0 8px">Read and sign</mj-button>`),
  },
  {
    key: 'contract-for-signature',
    name: 'Contract sent for signature',
    description: 'Sent to a counterparty when Legal sends a contract out.',
    subject: 'Contract for your signature: {{contractTitle}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Contract for signature</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{party}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">{{message}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Contract</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{contractTitle}}</mj-text>`),
  },
];

/**
 * Creates any seeded fragment or template that is missing. Idempotent, and never an update:
 * an existing row is somebody's edit and is left exactly as it is.
 */
export async function ensureEmailDefaults(): Promise<void> {
  let created = 0;

  for (const fragment of FRAGMENTS) {
    const result = await EmailFragmentModel.updateOne(
      { key: fragment.key },
      { $setOnInsert: fragment },
      { upsert: true },
    );
    created += result.upsertedCount ?? 0;
  }

  for (const template of TEMPLATES) {
    const result = await EmailTemplateModel.updateOne(
      { key: template.key },
      { $setOnInsert: { ...template, isActive: true } },
      { upsert: true },
    );
    created += result.upsertedCount ?? 0;
  }

  if (created > 0) {
    logger.info(`Seeded ${created} email fragment(s)/template(s)`);
  }
}
