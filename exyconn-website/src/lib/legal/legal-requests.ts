import { RESPONSE_BUSINESS_DAYS } from "./commitments";
import type { LegalDocument } from "./types";

/**
 * The legal and copyright request page. The topics are the four tabs the page used to show
 * (one card grid duplicated them); the FAQ quotes the grievance page's response time.
 */
export const LEGAL_REQUESTS: LegalDocument = {
  metaTitle: "Legal | Exyconn",
  metaDescription:
    "Submit legal requests regarding copyright, content removal, or intellectual property on Exyconn.",
  metaKeywords: "legal, copyright, takedown, intellectual property, privacy, trademark, Exyconn",
  title: "Legal and copyright requests",
  updated: "2026-10-03",
  summary: [
    "Report copyright infringement, image or content takedowns, trademark or privacy concerns, and other legal issues.",
    "Tell us the URLs involved, your rights to the content and how to reach you.",
    "Submissions are handled confidentially by our compliance and legal teams.",
    `Most requests are reviewed within ${RESPONSE_BUSINESS_DAYS} business days.`,
  ],
  sections: [
    {
      id: "what-you-can-report",
      label: "What you can report",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "Exyconn respects intellectual property rights and is committed to compliance with all applicable laws. Submit your legal concerns below.",
          ],
        },
        {
          kind: "topics",
          items: [
            {
              title: "Copyright infringement",
              text: "If you believe your copyrighted material has been used on our website without permission, you can submit a takedown request. Please provide details and evidence of ownership to help us process your claim efficiently.",
              points: [
                "Images, text, or media used without authorization",
                "Proof of ownership or rights required",
                "Swift review and removal if validated",
              ],
            },
            {
              title: "Image or content takedown",
              text: "To request removal of images or content you own or have rights to, submit a detailed request. We respect all valid takedown notices and act promptly to resolve such issues.",
              points: [
                "Specify the URL(s) of the content in question",
                "Describe your rights to the content",
                "We will investigate and respond quickly",
              ],
            },
            {
              title: "Trademark and privacy",
              text: "If you have concerns about trademark misuse or privacy/data issues on our site, please let us know. We are committed to protecting intellectual property and personal data.",
              points: [
                "Trademark violations or impersonation",
                "Personal data or privacy complaints",
                "Handled confidentially by our compliance team",
              ],
            },
            {
              title: "Other legal issues",
              text: "For any other legal concerns not listed above, please describe your issue in detail. Our legal and compliance team will review and respond as appropriate.",
              points: [
                "General legal inquiries",
                "Policy clarification or compliance requests",
                "We strive for transparency and fairness",
              ],
            },
          ],
        },
      ],
    },
    { id: "how-requests-are-handled", label: "How requests are handled", blocks: [] },
    { id: "submit-a-request", label: "Submit a request", blocks: [] },
  ],
  faqs: [
    {
      question: "How long does it take to process a legal or copyright request?",
      answer: `Most requests are reviewed within ${RESPONSE_BUSINESS_DAYS} business days. Complex cases or those requiring additional information may take longer. We will notify you by email once your request has been processed or if we need more details.`,
    },
    {
      question: "What information do I need to provide for a takedown or copyright claim?",
      answer:
        "Please provide a clear description of the content in question, the URL(s) where it appears, proof of ownership or rights, and your contact details. The more information you provide, the faster we can process your request.",
    },
    {
      question: "Will my grievance or legal request be kept confidential?",
      answer:
        "Yes, all submissions are handled confidentially and only shared with our compliance and legal teams as necessary to resolve your issue.",
    },
    {
      question: "What happens after I submit a legal request?",
      answer:
        "Our compliance team will review your submission, verify the details, and take appropriate action. You may be contacted for additional information if needed. We strive to resolve all valid requests promptly and fairly.",
    },
    {
      question: "Can I follow up on my request?",
      answer: `Yes, if you have not received a response within ${RESPONSE_BUSINESS_DAYS} business days, you may follow up by replying to our confirmation email or contacting us through our official channels.`,
    },
  ],
};
