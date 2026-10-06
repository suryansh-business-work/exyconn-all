/** The props of 'offer.page' (@exyconn/cms catalogue/offer*.ts): every word of the India offer. */
import type { IndiaOfferFormCopy } from "../../forms/india-offer";
import type { InnerAction } from "../../inner/types";
import type { CmsPlanFeature, OfferPlan } from "../../../lib/india/plans";
import type { CmsCard, CmsCrumb } from "../company/types";

interface Heading {
  label: string;
  title: string;
}

export type OfferPageProps = Readonly<{
  hero: {
    crumbs: CmsCrumb[];
    title: string;
    lede: string;
    primary: InnerAction;
    secondary: InnerAction;
  };
  problems: Heading & { items: { icon: string; title: string; text: string }[] };
  pricing: Heading & {
    lede: string;
    /** The badge on the popular plan's card. */
    popular: string;
    /** Where each plan's button goes (the enquiry form). */
    planHref: string;
  };
  plans: OfferPlan[];
  features: CmsPlanFeature[];
  steps: Heading & { steps: { title: string; text: string }[] };
  comparison: Heading & { feature: string; yes: string; no: string };
  services: Heading & {
    lede: string;
    more: string;
    all: InnerAction;
    groups: { title: string; items: CmsCard[] }[];
  };
  enquiry: Heading & { lede: string; points: string[]; formLabel: string };
  /** The direct channels; the phone number itself comes from Admin › Branding. */
  contact: { phoneLabel: string; emailLabel: string; email: string };
  cta: { title: string; text: string; primary: InnerAction };
  form: IndiaOfferFormCopy;
}>;
