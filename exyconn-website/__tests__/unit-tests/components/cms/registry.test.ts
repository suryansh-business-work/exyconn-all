/**
 * The CMS registry: every catalogue key has an Astro renderer, and an unknown key has none.
 * The Astro components themselves only compile inside Astro, so each is a stand-in here.
 */
import { describe, expect, it, vi } from "vitest";
import { CMS_COMPONENTS } from "@exyconn/cms";

const astro = vi.hoisted(() => {
  const component = (): null => null;
  return { component, factory: () => ({ default: component }) };
});

vi.mock("../../../../src/components/cms/chrome/ChromeFooter.astro", astro.factory);
vi.mock("../../../../src/components/cms/chrome/ChromeHeader.astro", astro.factory);
vi.mock("../../../../src/components/home/ClosingChapter.astro", astro.factory);
vi.mock("../../../../src/components/home/HeroChapter.astro", astro.factory);
vi.mock("../../../../src/components/home/HomeStage.astro", astro.factory);
vi.mock("../../../../src/components/home/IndustriesChapter.astro", astro.factory);
vi.mock("../../../../src/components/home/PartnerChapter.astro", astro.factory);
vi.mock("../../../../src/components/home/PlatformsMarquee.astro", astro.factory);
vi.mock("../../../../src/components/home/SolutionsChapter.astro", astro.factory);
vi.mock("../../../../src/components/cms/agents/OrderAgents.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyBeliefs.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyChapter.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyContact.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyCta.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyHorizons.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyInfoGrid.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyLinkCards.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyLinkRows.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyMarketReach.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyPlatformHub.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyQuote.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyRelatedHubs.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanySitemap.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyStage.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyStatement.astro", astro.factory);
vi.mock("../../../../src/components/cms/company/CompanyStats.astro", astro.factory);
vi.mock("../../../../src/components/cms/forms/GrievanceForm.astro", astro.factory);
vi.mock("../../../../src/components/cms/forms/LegalRequestForm.astro", astro.factory);
vi.mock("../../../../src/components/cms/legal/LegalDocument.astro", astro.factory);
vi.mock("../../../../src/components/cms/legal/LegalFaq.astro", astro.factory);
vi.mock("../../../../src/components/cms/legal/LegalSectionBlock.astro", astro.factory);
vi.mock("../../../../src/components/cms/offer/OfferPage.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailArchitecture.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailIntro.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailLogos.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailOfferings.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailProcess.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailRelated.astro", astro.factory);
vi.mock("../../../../src/components/detail/DetailTabs.astro", astro.factory);
vi.mock("../../../../src/components/cms/detail/DetailCta.astro", astro.factory);
vi.mock("../../../../src/components/cms/detail/DetailFaq.astro", astro.factory);
vi.mock("../../../../src/components/cms/detail/DetailLive.astro", astro.factory);
vi.mock("../../../../src/components/cms/detail/DetailProof.astro", astro.factory);
vi.mock("../../../../src/components/cms/detail/DetailStage.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceBenefits.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceDefinition.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceFaq.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceGroupedCards.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceInfoGrid.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceRelatedHubs.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/ServiceSteps.astro", astro.factory);
vi.mock("../../../../src/components/cms/service/WhatsappDemo.astro", astro.factory);
vi.mock("../../../../src/components/cms/ai/AiGovernance.astro", astro.factory);
vi.mock("../../../../src/components/cms/aiservice/AiServiceApproach.astro", astro.factory);
vi.mock("../../../../src/components/cms/aiservice/AiServiceCatalogue.astro", astro.factory);
vi.mock("../../../../src/components/cms/aiservice/AiServiceOutcomes.astro", astro.factory);
vi.mock("../../../../src/components/cms/aiservice/AiServiceRelated.astro", astro.factory);
vi.mock("../../../../src/components/blog/BlogArticle.astro", astro.factory);
vi.mock("../../../../src/components/blog/BlogList.astro", astro.factory);
vi.mock("../../../../src/components/case-studies/CaseStudyArticle.astro", astro.factory);
vi.mock("../../../../src/components/case-studies/CaseStudyList.astro", astro.factory);
vi.mock("../../../../src/components/career/CareerCompany.astro", astro.factory);
vi.mock("../../../../src/components/career/CareerGig.astro", astro.factory);
vi.mock("../../../../src/components/career/CareerGigs.astro", astro.factory);
vi.mock("../../../../src/components/career/CareerIndex.astro", astro.factory);
vi.mock("../../../../src/components/career/CareerJob.astro", astro.factory);
vi.mock("../../../../src/components/tools/ToolDetail.astro", astro.factory);
vi.mock("../../../../src/components/tools/ToolsList.astro", astro.factory);
vi.mock("../../../../src/components/policies/PolicyDetail.astro", astro.factory);
vi.mock("../../../../src/components/policies/PolicyList.astro", astro.factory);
vi.mock("../../../../src/components/newsletter/NewsletterIssue.astro", astro.factory);
vi.mock("../../../../src/components/newsletter/NewsletterList.astro", astro.factory);
vi.mock("../../../../src/components/newsletter/NewsletterSignup.astro", astro.factory);

import { cmsRenderer } from "../../../../src/components/cms/registry";

describe("cmsRenderer", () => {
  it("has a renderer for every component in the CMS catalogue", () => {
    expect(CMS_COMPONENTS.length).toBeGreaterThan(0);
    const missing = CMS_COMPONENTS.map((def) => def.key).filter((key) => !cmsRenderer(key));
    expect(missing).toEqual([]);
  });

  it("hands back the Astro component registered for a key", () => {
    expect(cmsRenderer("chrome.header")).toBe(astro.component);
    expect(cmsRenderer("company.quote")).toBe(astro.component);
    expect(cmsRenderer("newsletter.signup")).toBe(astro.component);
  });

  it("knows nothing of a key this build does not have", () => {
    expect(cmsRenderer("company.unknown")).toBeUndefined();
    expect(cmsRenderer("")).toBeUndefined();
  });

  it("does not mistake inherited object members for components", () => {
    expect(cmsRenderer("toString")).toBeUndefined();
    expect(cmsRenderer("constructor")).toBeUndefined();
    expect(cmsRenderer("__proto__")).toBeUndefined();
  });
});
