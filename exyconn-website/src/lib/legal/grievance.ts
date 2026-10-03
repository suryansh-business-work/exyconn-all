import { RESPONSE_BUSINESS_DAYS } from "./commitments";
import type { LegalDocument } from "./types";

/** The grievance page: its commitments, then the form (wording unchanged). */
export const GRIEVANCE: LegalDocument = {
  metaTitle: "Raise a Grievance | Report Concerns | Exyconn",
  metaDescription:
    "Submit your grievance or concern to Exyconn. We are committed to transparency, fairness, and prompt resolution for all stakeholders.",
  metaKeywords: "grievance, complaint, concern, compliance, Exyconn",
  title: "Raise a grievance",
  summary: [
    "Share any concern or grievance with us; our compliance team reviews every submission.",
    "Your identity is protected throughout the process.",
    "Every concern is reviewed impartially.",
    `We aim to respond within ${RESPONSE_BUSINESS_DAYS} business days.`,
  ],
  sections: [
    {
      id: "our-commitment",
      label: "Our commitment",
      blocks: [
        {
          kind: "paragraph",
          parts: [
            "At Exyconn, we uphold the highest standards of integrity, transparency, and accountability. If you have a concern or grievance, we encourage you to share it with us.",
          ],
        },
        {
          kind: "paragraph",
          parts: [
            "All submissions are handled confidentially and reviewed by our compliance team. We strive for prompt and just resolution.",
          ],
        },
        {
          kind: "terms",
          items: [
            { term: "Confidential", text: "Your identity is protected throughout the process" },
            { term: "Fair Review", text: "Every concern is reviewed impartially by our team" },
            {
              term: "Prompt Response",
              text: `We aim to respond within ${RESPONSE_BUSINESS_DAYS} business days`,
            },
          ],
        },
      ],
    },
    { id: "submit-your-grievance", label: "Submit your grievance", blocks: [] },
  ],
};
