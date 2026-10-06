import type { CmsComponentProps } from "@exyconn/cms";

/**
 * The careers components' copy, as the CMS catalogue shapes it (@exyconn/cms
 * catalogue/career.copy*.ts): every word of the careers pages arrives as props.
 */
export type CareerIndexCopy = CmsComponentProps<"career.index">;
export type CareerGigsCopy = CmsComponentProps<"career.gigs">;
export type CareerGigCopy = CmsComponentProps<"career.gig">;
export type CareerCompanyCopy = CmsComponentProps<"career.company">;
export type CareerJobCopy = CmsComponentProps<"career.job">;

/** The open-roles chapter's filter, count and no-match labels. */
export type RoleListCopy = CareerIndexCopy["roles"]["list"];
