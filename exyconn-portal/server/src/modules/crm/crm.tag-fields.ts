/**
 * A company's or contact's own labels, e.g. "Hot", "Partner referral". Kept apart from
 * crm.tags.ts, which imports both models: defining the field there made a require cycle in
 * which whichever model loaded second was built before the field existed, without tags.
 */
export const tagFields = {
  tags: { type: [String], default: [], index: true },
};
