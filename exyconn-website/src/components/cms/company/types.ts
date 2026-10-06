/**
 * The shapes the company-area CMS components (@exyconn/cms catalogue/company*.ts) take as
 * props. The CMS stores every field, even an empty one, so an editor's form always shows it:
 * an empty label means "no button", an empty lede "no lede".
 */
import type { InnerAction } from "../../inner/types";

export interface CmsAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface CmsCrumb {
  label: string;
  /** Empty for the current page's crumb. */
  href: string;
}

export interface CmsCard {
  title: string;
  text: string;
  href: string;
}

/** A button only when it has a label; the CMS keeps an empty one so the field stays editable. */
export const cmsAction = (action: CmsAction | undefined): InnerAction | undefined =>
  action?.label ? action : undefined;

/** Optional copy: an empty string renders nothing. */
export const cmsText = (text: string | undefined): string | undefined => text || undefined;
