import { PRIVACY_CONTACT_EMAIL } from "./commitments";
import type { LegalDocument } from "./types";

/** The cookie policy as published on the site (wording unchanged). */
export const COOKIE_POLICY: LegalDocument = {
  metaTitle: "Cookies Policy | How We Use Cookies | Exyconn",
  metaDescription:
    "Learn how Exyconn uses cookies and similar technologies to enhance your experience, analyze site usage, and provide relevant content.",
  metaKeywords: "cookies policy, cookie usage, privacy, Exyconn, website cookies, data protection",
  title: "Cookie policy",
  summary: [
    "Cookies are small text files placed on your device when you visit a website.",
    "We use them to remember your preferences, run essential features, analyse traffic and show relevant content.",
    "We use four types: essential, performance and analytics, functionality and marketing.",
    "You can manage them in your browser settings or in our cookie banner; turning them off may affect how the site works.",
  ],
  sections: [
    {
      id: "what-are-cookies",
      label: "What are cookies?",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to site owners.",
          ],
        },
      ],
    },
    {
      id: "how-we-use-cookies",
      label: "How we use cookies",
      blocks: [
        {
          kind: "list",
          items: [
            { text: "Remember your preferences and settings" },
            { text: "Enable essential website functionality" },
            { text: "Analyze site traffic and usage to improve our services" },
            { text: "Provide relevant content and enhance your experience" },
          ],
        },
      ],
    },
    {
      id: "types-of-cookies",
      label: "Types of cookies we use",
      blocks: [
        {
          kind: "terms",
          items: [
            {
              term: "Essential Cookies",
              text: "Necessary for the website to function. Cannot be switched off.",
            },
            {
              term: "Performance & Analytics",
              text: "Help us understand how visitors interact with our website.",
            },
            {
              term: "Functionality Cookies",
              text: "Remember choices you make and provide enhanced features.",
            },
            { term: "Marketing Cookies", text: "Used to deliver relevant advertisements to you." },
          ],
        },
      ],
    },
    {
      id: "managing-cookies",
      label: "Managing cookies",
      blocks: [
        { kind: "paragraph", parts: ["You can control and manage cookies in various ways:"] },
        {
          kind: "list",
          items: [
            {
              term: "Browser Settings:",
              text: 'Find these in the "options" or "preferences" menu of your browser.',
            },
            {
              term: "Cookie Banner:",
              text: "Use our cookie consent banner when you first visit to manage preferences.",
            },
          ],
        },
        {
          kind: "note",
          text: "Note: Disabling cookies may affect the functionality of this website.",
        },
      ],
    },
    {
      id: "questions",
      label: "Questions?",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "For more details about how we use and protect your data, see our ",
            { text: "Privacy Policy", href: "/privacy-policy" },
            ". Contact us at ",
            { text: PRIVACY_CONTACT_EMAIL, href: `mailto:${PRIVACY_CONTACT_EMAIL}` },
            " for any questions.",
          ],
        },
      ],
    },
  ],
};
