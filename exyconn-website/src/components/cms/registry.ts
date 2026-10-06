import type { CmsComponentKey } from "@exyconn/cms";
// First, so the inner pages' shared stage CSS is ordered before every section's own CSS (as on
// a hand-written page, where the page's CSS comes last and wins a tie).
import "../../styles/inner-stage.css";
import ChromeFooter from "./chrome/ChromeFooter.astro";
import ChromeHeader from "./chrome/ChromeHeader.astro";
import ClosingChapter from "../home/ClosingChapter.astro";
import HeroChapter from "../home/HeroChapter.astro";
import HomeStage from "../home/HomeStage.astro";
import IndustriesChapter from "../home/IndustriesChapter.astro";
import PartnerChapter from "../home/PartnerChapter.astro";
import PlatformsMarquee from "../home/PlatformsMarquee.astro";
import SolutionsChapter from "../home/SolutionsChapter.astro";
import OrderAgents from "./agents/OrderAgents.astro";
import CompanyBeliefs from "./company/CompanyBeliefs.astro";
import CompanyChapter from "./company/CompanyChapter.astro";
import CompanyContact from "./company/CompanyContact.astro";
import CompanyCta from "./company/CompanyCta.astro";
import CompanyHorizons from "./company/CompanyHorizons.astro";
import CompanyInfoGrid from "./company/CompanyInfoGrid.astro";
import CompanyLinkCards from "./company/CompanyLinkCards.astro";
import CompanyLinkRows from "./company/CompanyLinkRows.astro";
import CompanyMarketReach from "./company/CompanyMarketReach.astro";
import CompanyPlatformHub from "./company/CompanyPlatformHub.astro";
import CompanyQuote from "./company/CompanyQuote.astro";
import CompanyRelatedHubs from "./company/CompanyRelatedHubs.astro";
import CompanySitemap from "./company/CompanySitemap.astro";
import CompanyStage from "./company/CompanyStage.astro";
import CompanyStatement from "./company/CompanyStatement.astro";
import CompanyStats from "./company/CompanyStats.astro";
import GrievanceForm from "./forms/GrievanceForm.astro";
import LegalRequestForm from "./forms/LegalRequestForm.astro";
import LegalDocument from "./legal/LegalDocument.astro";
import LegalFaq from "./legal/LegalFaq.astro";
import LegalSectionBlock from "./legal/LegalSectionBlock.astro";
import OfferPage from "./offer/OfferPage.astro";

/** Any Astro component, whatever its props. */
type CmsRenderer = (props: never) => unknown;

/**
 * Every CMS component key (@exyconn/cms CMS_COMPONENTS) → the Astro component that renders
 * it. `satisfies Record<CmsComponentKey, …>` is the agreement check: a catalogue key with no
 * renderer, or a renderer for a key the catalogue does not have, fails `pnpm typecheck` (and
 * so CI). Each component receives its block's props plus `cms` (CmsRenderContext), and a
 * component that takes children gets them as its default slot.
 *
 * Every component here is imported by every CMS page, so its CSS ships with all of them:
 * keep component styles scoped (`<style>` in the component) or namespaced to the component.
 */
const REGISTRY = {
  "chrome.header": ChromeHeader,
  "chrome.footer": ChromeFooter,
  "home.stage": HomeStage,
  "home.hero": HeroChapter,
  "home.solutions": SolutionsChapter,
  "home.industries": IndustriesChapter,
  "home.partner": PartnerChapter,
  "home.platforms": PlatformsMarquee,
  "home.closing": ClosingChapter,
  "company.stage": CompanyStage,
  "company.stats": CompanyStats,
  "company.chapter": CompanyChapter,
  "company.info-grid": CompanyInfoGrid,
  "company.link-cards": CompanyLinkCards,
  "company.beliefs": CompanyBeliefs,
  "company.market-reach": CompanyMarketReach,
  "company.statement": CompanyStatement,
  "company.horizons": CompanyHorizons,
  "company.cta": CompanyCta,
  "company.related-hubs": CompanyRelatedHubs,
  "company.link-rows": CompanyLinkRows,
  "company.contact": CompanyContact,
  "company.quote": CompanyQuote,
  "company.platform-hub": CompanyPlatformHub,
  "company.sitemap": CompanySitemap,
  "legal.document": LegalDocument,
  "legal.section": LegalSectionBlock,
  "legal.faq": LegalFaq,
  "forms.legal": LegalRequestForm,
  "forms.grievance": GrievanceForm,
  "agents.order": OrderAgents,
  "offer.page": OfferPage,
} satisfies Record<CmsComponentKey, CmsRenderer>;

/**
 * A renderer as CmsBlocks calls it: with the JSON props the CMS stored. Those are only as
 * typed as the editor's JSON, so each component's own Props are deliberately not enforced here.
 */
export type CmsComponent = (props: Record<string, unknown>) => unknown;

const isKey = (key: string): key is CmsComponentKey => Object.hasOwn(REGISTRY, key);

/** The component for a key, or undefined for a key this build does not know. */
export function cmsRenderer(key: string): CmsComponent | undefined {
  return isKey(key) ? (REGISTRY[key] as unknown as CmsComponent) : undefined;
}
