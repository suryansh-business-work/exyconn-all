import { PRIVACY_CONTACT_EMAIL } from "./commitments";
import type { LegalDocument } from "./types";

/** The privacy policy as published on the site (wording unchanged; last updated 27 June 2025). */
export const PRIVACY_POLICY: LegalDocument = {
  metaTitle: "Privacy Policy | Data Protection | Exyconn",
  metaDescription:
    "Read Exyconn's privacy policy to learn how we collect, use, and protect your personal information when you use our website and AI automation services.",
  metaKeywords: "privacy policy, data protection, personal information, cookies, Exyconn",
  title: "Privacy policy",
  updated: "2025-06-27",
  summary: [
    "We collect the contact details you give us, usage data such as your IP address and browser, and cookies.",
    "We use it to run and improve our website and services, to answer you, and to meet legal obligations.",
    "We do not sell your personal information.",
    "You can access, correct or delete your information, and opt out of marketing.",
  ],
  sections: [
    {
      id: "introduction",
      label: "Introduction",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            'Exyconn ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI automation services.',
          ],
        },
      ],
    },
    {
      id: "information-we-collect",
      label: "Information we collect",
      blocks: [
        {
          kind: "list",
          items: [
            {
              term: "Personal Information:",
              text: "Name, email address, phone number, company name, and other contact details you provide.",
            },
            {
              term: "Usage Data:",
              text: "IP address, browser type, device information, and pages visited.",
            },
            {
              term: "Cookies & Tracking:",
              text: "We use cookies and similar technologies to enhance your experience.",
            },
          ],
        },
      ],
    },
    {
      id: "how-we-use-information",
      label: "How we use your information",
      blocks: [
        {
          kind: "list",
          items: [
            { text: "To provide, operate, and maintain our website and services" },
            { text: "To communicate with you and respond to inquiries" },
            { text: "To improve our products, services, and user experience" },
            { text: "To comply with legal obligations and protect our rights" },
          ],
        },
      ],
    },
    {
      id: "sharing-information",
      label: "Sharing your information",
      blocks: [
        {
          kind: "list",
          items: [
            { text: "We do not sell your personal information" },
            {
              text: "We may share with trusted service providers under confidentiality agreements",
            },
            { text: "We may disclose information if required by law" },
          ],
        },
      ],
    },
    {
      id: "data-security",
      label: "Data security",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "We implement reasonable technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, or destruction.",
          ],
        },
      ],
    },
    {
      id: "your-rights",
      label: "Your rights",
      blocks: [
        { kind: "paragraph", parts: ["You have the right to:"] },
        {
          kind: "list",
          items: [
            { text: "Access your personal information" },
            { text: "Correct inaccurate data" },
            { text: "Delete your personal information" },
            { text: "Opt out of marketing communications" },
          ],
        },
      ],
    },
    {
      id: "contact-us",
      label: "Contact us",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "If you have any questions about this Privacy Policy or our data practices, please contact us at ",
            { text: PRIVACY_CONTACT_EMAIL, href: `mailto:${PRIVACY_CONTACT_EMAIL}` },
            ".",
          ],
        },
      ],
    },
  ],
};
