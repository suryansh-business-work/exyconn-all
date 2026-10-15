export const S = {
  title: "Share or copy this estimate",
  native: "Share…",
  copy: "Copy summary",
  copied: "Summary copied to the clipboard.",
  copyFailed: "Copying was blocked by the browser. Select the summary below and copy it instead.",
  json: "Download JSON to send",
  jsonNote: "A JSON file restores the full estimate in any browser via Import.",
  linkTitle: "Read-only link (stored on Exyconn's server)",
  linkIntro:
    "Creates a link anyone who has it can open, read-only, until it expires. The estimate (including any company details you entered) is stored on Exyconn's server until then, and deleted after. You can revoke it at any time.",
  consent:
    "I agree that this estimate is stored on Exyconn's server until the link expires or is revoked.",
  consentError: "Agree to storage to create a link",
  expiry: "Link expires after",
  days: (count: number) => `${count} day${count === 1 ? "" : "s"}`,
  create: "Create link",
  creating: "Creating link…",
  created: (date: string) => `Link created. It works until ${date}.`,
  link: "Shareable link",
  copyLink: "Copy link",
  revokeLink: "Revocation link (keep it private)",
  revokeNote: "Open the revocation link later to switch the share off, or revoke it now.",
  revoke: "Revoke now",
  revoked: "The link is revoked. Anyone opening it now sees that it is no longer available.",
  revokeFailed: (message: string) => `The link could not be revoked: ${message}`,
  unavailable: (message: string) =>
    `${message} You can still copy the summary or send the JSON file instead.`,
  shared: {
    loading: "Opening the shared estimate…",
    readOnly: (date: string) => `Shared estimate — read-only. The link expires ${date}.`,
    missing:
      "This shared estimate is no longer available: the link has expired, was revoked, or is incorrect.",
    failed: (message: string) => `The shared estimate could not be loaded. ${message}`,
    saveCopy: "Save a copy to this browser",
    saved: "Saved. Opening it in the calculator…",
    saveFailed: "This browser would not save the copy (storage blocked or full).",
    openCalculator: "Open the calculator",
    revokeTitle: "Revoke this link",
    revokeIntro:
      "You opened the revocation link for this estimate. Revoking stops the link working for everyone.",
  },
} as const;

export const EXPIRY_DAYS = [1, 7, 30] as const;
