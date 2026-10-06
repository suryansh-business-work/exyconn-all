import { absoluteAsset, marketPageUrl } from "../../content/format";
import { articleJsonLd } from "../../content/structured-data";
import { BRANDING_FALLBACK, getCaseStudy } from "../../portal";
import type { CaseStudy } from "../../portal/types";
import { itemCrumbs, itemCrumbsJsonLd } from "./crumbs";
import type { PageLoader } from "./types";

/** What the case study template reads before rendering (cms.detail of 'casestudy.article'). */
export interface CaseStudyDetail {
  study: CaseStudy;
  url: string;
}

/** A story by the template's slug, its SEO values and structured data. */
export const caseStudyLoader: PageLoader = async (input) => {
  const { params, site, market, siteUrl, props } = input;
  const study = params.slug ? await getCaseStudy(params.slug, site) : null;
  if (!study) {
    return null;
  }
  const url = marketPageUrl(siteUrl, market, `/case-studies/${study.slug}`);
  const detail: CaseStudyDetail = { study, url };
  return {
    item: detail,
    ogType: "article",
    vars: {
      title: study.title,
      summary: study.excerpt,
      tags: study.tags.join(", "),
      coverImage: study.coverImage,
    },
    jsonLd: [
      articleJsonLd({
        type: "Article",
        headline: study.title,
        description: study.excerpt,
        image: absoluteAsset(siteUrl, study.coverImage),
        published: study.publishedAt,
        url,
        keywords: study.tags,
        section: study.category,
        publisher: {
          name: BRANDING_FALLBACK.businessName,
          url: siteUrl,
          logo: `${siteUrl}${BRANDING_FALLBACK.faviconUrl}`,
        },
      }),
      itemCrumbsJsonLd(itemCrumbs(props, study.title), input, url),
    ],
  };
};
