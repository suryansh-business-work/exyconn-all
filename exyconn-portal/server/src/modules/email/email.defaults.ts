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

/**
 * The overdue chase as first seeded, before it carried a payment link. Kept so
 * `ensureEmailDefaults` can recognise an untouched copy and give it the link (OVERDUE_BODY);
 * a copy somebody edited is never overwritten.
 */
const OVERDUE_BODY_V1 = `        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Invoice {{invoiceNumber}} is overdue</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{clientName}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Our records show invoice {{invoiceNumber}} is still unpaid, {{daysLate}} days after it was due.
          If it is already on its way, thank you — please ignore this note.
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Balance due</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{balanceDue}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Was due by</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{dueDate}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          Reply to this email if the invoice needs correcting, or to tell us when it will be settled.
        </mj-text>`;

/** A "Pay now" button into the client hub, for the chase and the due-soon reminder. */
const PAY_BUTTON = `        <mj-button background-color="#155dfc" border-radius="10px" href="{{payUrl}}" padding="24px 0 8px">Pay now</mj-button>
`;

const OVERDUE_BODY = OVERDUE_BODY_V1.replace(
  `        <mj-text font-size="13px" color="#94a3b8">
          Reply to this email if the invoice needs correcting`,
  `${PAY_BUTTON}        <mj-text font-size="13px" color="#94a3b8">
          Reply to this email if the invoice needs correcting`,
);

const TEMPLATES = [
  {
    key: 'tracker-digest',
    name: 'Tracker digest — daily / weekly summary',
    description:
      'Tracked hours per employee for the period, emailed to everyone holding the Tracker role. Sent by the tracker digest schedule; the {{rows}} value is a finished table body.',
    subject: 'Tracked time {{periodLabel}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Tracked time {{periodLabel}}</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          <strong>{{employeeCount}}</strong> people tracked <strong>{{totalHours}} hours</strong> {{periodLabel}}.
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-table font-size="14px" color="#0b0a12">
          <tr style="border-bottom:1px solid #e2e8f0;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">
            <th style="padding:6px 0;">Employee</th>
            <th style="padding:6px 0;text-align:right;">Tracked</th>
            <th style="padding:6px 0;text-align:right;">Off-computer</th>
          </tr>
          {{rows}}
        </mj-table>
        <mj-text font-size="13px" color="#94a3b8">
          Off-computer time is work claimed away from the computer and approved by a reviewer.
          Open the Tracker console for screenshots, activity levels and the full day.
        </mj-text>`),
  },
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
    key: 'salary-slip',
    name: 'Salary slip',
    description:
      'The monthly payslip, with the PDF attached. Sent by HR on the payroll schedule or on demand.',
    subject: 'Your payslip for {{period}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your payslip for {{period}}</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Your payslip for <strong>{{period}}</strong> is attached to this email as a PDF.
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Net pay</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{netPay}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Payment status</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{status}}</mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{slipsUrl}}" padding="24px 0 8px">See all my payslips</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          If anything on it looks wrong, reply to this email and HR will pick it up.
        </mj-text>`),
  },
  {
    key: 'contract-for-signature',
    name: 'Contract sent for signature',
    description:
      'Sent to a counterparty when Legal asks for a signature. The button carries the link that identifies them.',
    subject: 'Contract for your signature: {{contractTitle}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Contract for signature</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{party}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">{{message}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Contract</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{contractTitle}}</mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{signingUrl}}" padding="24px 0 8px">Read and sign</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          This link is yours alone — please do not forward it. It stops working once the contract is signed.
        </mj-text>`),
  },
  {
    key: 'support-reply',
    name: 'Support reply — your ticket has an answer',
    description:
      'Sent to the employee who raised a support ticket when the team replies. Internal notes never trigger it.',
    subject: 'Reply on your support ticket: {{ticketSubject}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your ticket has a reply</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{employeeName}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Support has replied on <strong>{{ticketSubject}}</strong>:
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="15px" color="#0b0a12" line-height="24px">{{replyBody}}</mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{link}}" padding="24px 0 8px">Open my tickets</mj-button>`),
  },
  {
    key: 'support-reply-client',
    name: 'Support reply — customer ticket',
    description:
      'Sent to the customer who raised a ticket on the public form when the team replies. Carries the reference so they can follow it up. Internal notes never trigger it.',
    subject: 'Reply on your support ticket {{reference}}: {{ticketSubject}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your ticket has a reply</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Our support team has replied on <strong>{{ticketSubject}}</strong>:
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="15px" color="#0b0a12" line-height="24px">{{replyBody}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Your reference</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{reference}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          Reply to this email to continue the conversation, and quote the reference above.
        </mj-text>`),
  },
  {
    key: 'password-reset',
    name: 'Password reset — self-service link',
    description:
      'Sent when somebody asks for a reset link from a portal login screen. The link works once and expires after {{expiresIn}}.',
    subject: 'Reset your {{companyName}} portal password',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Reset your password</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Somebody asked to reset the password for this address. If it was you, choose a new one below.
          The link works once and expires in {{expiresIn}}.
        </mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{link}}" padding="24px 0 8px">Choose a new password</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          If you did not ask for this, ignore this email — your password stays as it is.
        </mj-text>`),
  },
  {
    key: 'applicant-stage',
    name: 'Applicant — your application has moved',
    description:
      'Sent to a job applicant when HR moves them to Interview, Offer or Rejected. {{message}} is the stage-specific wording, decided by the pipeline.',
    subject: 'Your application for {{jobTitle}}: {{stageLabel}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your application for {{jobTitle}}</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">{{message}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Stage</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{stageLabel}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          Reply to this email if you have any questions about your application.
        </mj-text>`),
  },
  {
    key: 'problem-report-update',
    name: 'Problem report — status update',
    description:
      'Sent to whoever filed a problem report from the status page when Tech changes its status. {{resolutionNotes}} is what Tech wrote, or a placeholder when empty.',
    subject: 'Update on your report {{reference}}: {{status}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Update on your report</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Your report <strong>{{reference}}</strong> about <strong>{{serviceName}}</strong> is now <strong>{{status}}</strong>.
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Notes from the team</mj-text>
        <mj-text font-size="15px" color="#0b0a12" line-height="24px" padding-top="0">{{resolutionNotes}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          You can check this report at any time by quoting its reference on the status page.
        </mj-text>`),
  },
  {
    key: 'status-subscribe-confirm',
    name: 'Status page — confirm your subscription',
    description:
      'Double opt-in for the public status page. Sent the moment somebody enters an address; nothing else is sent until they follow {{confirmUrl}}.',
    subject: 'Confirm your {{companyName}} status updates',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">One click and you are subscribed</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Somebody asked for {{companyName}} status updates at this address. If it was you, confirm below and
          we will email you when something breaks and again when it is fixed.
        </mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{confirmUrl}}" padding="24px 0 8px">Confirm my subscription</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          If you did not ask for this, ignore this email — nothing further will be sent. You can also
          <a href="{{unsubscribeUrl}}">remove this address</a> right away.
        </mj-text>`),
  },
  {
    key: 'status-incident-notice',
    name: 'Status page — incident and maintenance notice',
    description:
      'Sent to every confirmed status subscriber when an incident opens or resolves, and when a maintenance window is planned. {{headline}} is also the subject line.',
    subject: '{{headline}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">{{headline}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Service</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{serviceName}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="15px" color="#334155" line-height="24px">{{detail}}</mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{statusUrl}}" padding="24px 0 8px">See the live status page</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          You are getting this because you subscribed to {{companyName}} status updates.
          <a href="{{unsubscribeUrl}}">Unsubscribe</a>.
        </mj-text>`),
  },
  {
    key: 'notification',
    name: 'Notification — by email',
    description:
      'One portal notification, sent to somebody who asked for that kind by email in their account settings.',
    subject: '{{title}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">{{title}}</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">{{body}}</mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{actionUrl}}" padding="24px 0 8px">Open the portal</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          You are getting this because you asked for these by email. Change that under Settings in any portal.
        </mj-text>`),
  },
  {
    key: 'invoice-sent',
    name: 'Invoice sent to client',
    description:
      'Sent to a client when Finance sends an invoice out. The PDF is attached automatically.',
    subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Invoice {{invoiceNumber}}</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{clientName}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">{{message}}</mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Total</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{total}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Balance due</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{balanceDue}}</mj-text>
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Due by</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{dueDate}}</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          The invoice is attached to this email as a PDF. Reply to this email with any questions.
        </mj-text>`),
  },
  {
    key: 'invoice-overdue',
    name: 'Invoice overdue — payment chase',
    description:
      'Sent to a client by the overdue invoice sweep, once at each chase stage after the due date. {{daysLate}} is the whole days since the date; {{payUrl}} opens the invoice in the client hub to pay it. The same wording carries every stage, so an edit here changes all of them.',
    subject: 'Invoice {{invoiceNumber}} is now {{daysLate}} days overdue',
    mjml: shell(OVERDUE_BODY),
  },
  {
    key: 'whatsapp-demo-code',
    name: 'WhatsApp demo — thank you and sign-in code',
    description:
      'Sent when a prospect asks to try the live WhatsApp demo, from the website or the demo’s own sign-in. {{code}} works once and expires in {{expiresIn}}; {{demoUrl}} is the demo.',
    subject: '{{code}} is your {{companyName}} WhatsApp demo code',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Thank you for booking a live demo</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Thanks for your interest in our WhatsApp automation. Enter this code where you asked for it to open the live demo
          and try every bot yourself — booking, orders, support and more.
        </mj-text>
        <mj-text align="center" font-size="34px" font-weight="700" letter-spacing="10px" color="#0b0a12" padding="16px 0">{{code}}</mj-text>
        <mj-text align="center" font-size="13px" color="#64748b" padding-top="0">The code works once and expires in {{expiresIn}}.</mj-text>
        <mj-button background-color="#25d366" color="#0b0a12" border-radius="10px" href="{{demoUrl}}" padding="24px 0 8px">Open the live demo</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          If you did not ask for this, ignore this email — nobody can sign in without the code.
        </mj-text>`),
  },
  {
    key: 'invoice-due-soon',
    name: 'Invoice due soon — payment reminder',
    description:
      'Sent to a client once, a few days before an unpaid invoice falls due. {{payUrl}} opens the invoice in the client hub to pay it online.',
    subject: 'Invoice {{invoiceNumber}} is due on {{dueDate}}',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Invoice {{invoiceNumber}} is due soon</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{clientName}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          A friendly reminder that invoice {{invoiceNumber}} falls due on {{dueDate}}. You can pay it online in a minute.
        </mj-text>
        <mj-divider border-color="#e2e8f0" />
        <mj-text font-size="14px" color="#64748b" padding-bottom="4px">Balance due</mj-text>
        <mj-text font-size="16px" font-weight="600" color="#0b0a12" padding-top="0">{{balanceDue}}</mj-text>
${PAY_BUTTON}        <mj-text font-size="13px" color="#94a3b8">
          Already paid? Thank you — please ignore this reminder.
        </mj-text>`),
  },
  {
    key: 'client-hub-code',
    name: 'Client hub — sign-in code',
    description:
      'Sent when a client contact signs in to the client hub. {{code}} works once and expires in {{expiresIn}}.',
    subject: '{{code}} is your {{companyName}} client hub code',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your sign-in code</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Enter this code in the client hub to see your invoices, payments, support tickets and projects.
        </mj-text>
        <mj-text align="center" font-size="34px" font-weight="700" letter-spacing="10px" color="#0b0a12" padding="16px 0">{{code}}</mj-text>
        <mj-text align="center" font-size="13px" color="#64748b" padding-top="0">The code works once and expires in {{expiresIn}}.</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          If you did not ask for this, ignore this email — nobody can sign in without the code.
        </mj-text>`),
  },
  {
    key: 'client-hub-invite',
    name: 'Client hub — access granted',
    description:
      'Sent when an administrator gives a client contact access to the client hub. {{hubUrl}} is where they sign in with their email.',
    subject: 'Your {{companyName}} client hub is ready',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Welcome to your client hub</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          You now have access to the {{companyName}} client hub for {{clientName}}: pay invoices online, download them,
          see every transaction, raise support tickets and follow your projects.
        </mj-text>
        <mj-button background-color="#155dfc" border-radius="10px" href="{{hubUrl}}" padding="24px 0 8px">Open the client hub</mj-button>
        <mj-text font-size="13px" color="#94a3b8">
          Sign in with this email address — we send you a one-time code, no password needed.
        </mj-text>`),
  },
  {
    key: 'website-chat-code',
    name: 'Website chat — sign-in code',
    description:
      'Sent when a visitor starts a chat on exyconn.com or tools.exyconn.com. {{code}} works once and expires in {{expiresIn}}.',
    subject: '{{code}} is your {{companyName}} chat code',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Confirm your email to start chatting</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Enter this code in the chat window to talk to our team and our knowledge bot.
        </mj-text>
        <mj-text align="center" font-size="34px" font-weight="700" letter-spacing="10px" color="#0b0a12" padding="16px 0">{{code}}</mj-text>
        <mj-text align="center" font-size="13px" color="#64748b" padding-top="0">The code works once and expires in {{expiresIn}}.</mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          If you did not ask for this, ignore this email — nobody can chat as you without the code.
        </mj-text>`),
  },
  {
    key: 'website-chat-started',
    name: 'Website chat — chat started',
    description:
      'Sent when a visitor confirms their email and their chat opens. {{reference}} is the support ticket the chat filed.',
    subject: 'Your chat with {{companyName}} has started ({{reference}})',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Thanks for reaching out</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Your chat with our team is open. We have filed it as ticket <strong>{{reference}}</strong>, so nothing you
          tell us gets lost — even if you close the window, a person will follow up.
        </mj-text>
        <mj-text font-size="13px" color="#94a3b8">
          Quote {{reference}} if you write to us about this conversation.
        </mj-text>`),
  },
  {
    key: 'website-chat-transcript',
    name: 'Website chat — conversation transcript',
    description:
      'Sent when a website chat ends, if Website > Chatbot > Settings asks for it. The whole conversation is attached as a text file. {{reference}} is the chat’s support ticket.',
    subject: 'Your chat with {{companyName}} ({{reference}})',
    mjml: shell(`        <mj-text font-size="20px" font-weight="700" color="#0b0a12">Your chat transcript</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">Hi {{name}},</mj-text>
        <mj-text font-size="15px" color="#334155" line-height="24px">
          Thanks for chatting with us. The whole conversation is attached to this email for your records.
          Your ticket reference is <strong>{{reference}}</strong>.
        </mj-text>`),
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
    created += result.upsertedCount;
  }

  for (const template of TEMPLATES) {
    const result = await EmailTemplateModel.updateOne(
      { key: template.key },
      { $setOnInsert: { ...template, isActive: true } },
      { upsert: true },
    );
    created += result.upsertedCount;
  }

  // The chase gained a "Pay now" link; an untouched copy of the first version gets it too.
  const upgraded = await EmailTemplateModel.updateOne(
    { key: 'invoice-overdue', mjml: shell(OVERDUE_BODY_V1) },
    { $set: { mjml: shell(OVERDUE_BODY) } },
  );

  if (created > 0 || upgraded.modifiedCount > 0) {
    logger.info(
      `Seeded ${created} email fragment(s)/template(s), upgraded ${upgraded.modifiedCount}`,
    );
  }
}
