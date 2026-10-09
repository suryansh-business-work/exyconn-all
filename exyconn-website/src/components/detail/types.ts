/**
 * The shapes of the capability and service detail sections' props (/ai/*, /services/*). Every
 * word arrives as props from the CMS (Website › Pages); the catalogue's defaults are in
 * @exyconn/cms (catalogue/detail.copy.ts).
 */
export interface DetailAction {
  label: string;
  href: string;
}

export interface DetailIntroCopy {
  title: string;
  icon: string;
  term: string;
  definition: string;
}

export interface DetailBenefits {
  title: string;
  items: readonly { icon: string; text: string }[];
}

export type DetailDemo =
  | {
      kind: "chat";
      title: string;
      caption: string;
      messages: readonly { from: "user" | "agent"; text: string }[];
    }
  | {
      kind: "trace";
      title: string;
      caption: string;
      steps: readonly { label: string; detail?: string }[];
    };

export interface DetailOfferingList {
  title: string;
  items: readonly { icon: string; title: string; text: string }[];
}

/** A logo with its intrinsic size (for the aspect ratio); an empty `src` shows none. */
export interface DetailLogo {
  name: string;
  src: string;
  width: number;
  height: number;
}

export interface DetailTab {
  label: string;
  summary: string;
  text: string;
  points: readonly string[];
  logo: DetailLogo;
}

export interface DetailStep {
  title: string;
  text: string;
  when: string;
}

export interface DetailRelatedCard {
  href: string;
  index: string;
  title: string;
  text: string;
  tags: readonly string[];
}
