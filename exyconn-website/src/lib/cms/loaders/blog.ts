import { relatedPosts } from "../../content/blog";
import { absoluteAsset, marketPageUrl } from "../../content/format";
import { articleJsonLd } from "../../content/structured-data";
import { BRANDING_FALLBACK, getBlogPost, getBlogPosts } from "../../portal";
import type { BlogPost } from "../../portal/types";
import { itemCrumbs, itemCrumbsJsonLd } from "./crumbs";
import type { PageLoader } from "./types";

/** What the blog article template reads before rendering (cms.detail of 'blog.article'). */
export interface BlogArticleDetail {
  post: BlogPost;
  related: BlogPost[];
  /** The article's absolute, market-correct URL. */
  url: string;
}

/** A post by the template's slug, its related posts, its SEO values and structured data. */
export const blogArticleLoader: PageLoader = async (input) => {
  const { params, site, market, siteUrl, props } = input;
  const post = params.slug ? await getBlogPost(params.slug, site) : null;
  if (!post) {
    return null;
  }
  const related = relatedPosts(post, await getBlogPosts(site));
  const url = marketPageUrl(siteUrl, market, `/blog/${post.slug}`);
  const detail: BlogArticleDetail = { post, related, url };
  return {
    item: detail,
    ogType: "article",
    vars: {
      title: post.title,
      summary: post.summary,
      tags: post.tags.join(", "),
      coverImage: post.coverImage,
    },
    jsonLd: [
      articleJsonLd({
        type: "BlogPosting",
        headline: post.title,
        description: post.summary,
        image: absoluteAsset(siteUrl, post.coverImage),
        published: post.publishedAt,
        url,
        keywords: post.tags,
        section: post.tags[0],
        author: post.author.name,
        publisher: {
          name: BRANDING_FALLBACK.businessName,
          url: siteUrl,
          logo: `${siteUrl}${BRANDING_FALLBACK.faviconUrl}`,
        },
      }),
      itemCrumbsJsonLd(itemCrumbs(props, post.title), input, url),
    ],
  };
};
