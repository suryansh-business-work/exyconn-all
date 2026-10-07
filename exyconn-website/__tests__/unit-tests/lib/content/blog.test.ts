/** Blog shaping: the constellation scene, the lead post, related posts and the sheet stack. */
import { describe, expect, it } from "vitest";
import {
  articleSheets,
  blogConstellation,
  GENERIC_CONSTELLATION,
  leadPost,
  relatedPosts,
} from "../../../../src/lib/content/blog";
import { blogPost } from "../cms/fixtures";

const post = (slug: string, tags: string[], featured = false) =>
  blogPost({ id: slug, slug, tags, featured });

describe("blogConstellation", () => {
  it("clusters posts by first tag and links every two posts that share a tag", () => {
    const posts = [
      post("a", ["AI", "Agents"]),
      post("c", ["Data"]),
      post("b", ["AI"]),
      post("d", []),
      post("e", ["Agents"]),
    ];
    // Stars run cluster by cluster: AI (a, b), Data (c), untagged (d), Agents (e).
    expect(blogConstellation(posts)).toEqual({
      groups: [2, 1, 1, 1],
      links: [
        [0, 1],
        [0, 4],
      ],
    });
  });

  it("caps the lines at 120", () => {
    const many = Array.from({ length: 30 }, (_, i) => post(`p${i}`, ["AI"]));
    const { groups, links } = blogConstellation(many);
    expect(groups).toEqual([30]);
    expect(links).toHaveLength(120);
    expect(links[0]).toEqual([0, 1]);
  });

  it("shows the generic constellation without posts", () => {
    const empty = blogConstellation([]);
    expect(empty).toEqual({ groups: [...GENERIC_CONSTELLATION], links: [] });
    expect(empty.groups).not.toBe(GENERIC_CONSTELLATION);
  });
});

describe("leadPost", () => {
  it("leads with the first featured post, else the newest, else nothing", () => {
    const posts = [post("new", []), post("hot", [], true), post("hotter", [], true)];
    expect(leadPost(posts)?.slug).toBe("hot");
    expect(leadPost([post("new", []), post("old", [])])?.slug).toBe("new");
    expect(leadPost([])).toBeUndefined();
  });
});

describe("relatedPosts", () => {
  const current = post("me", ["AI", "Agents"]);
  const others = [
    post("x", ["Data"]),
    post("y", ["AI"]),
    post("z", ["Agents", "AI"]),
    post("w", []),
  ];

  it("ranks by shared tags, then the original order, never the post itself", () => {
    expect(relatedPosts(current, [current, ...others]).map((p) => p.slug)).toEqual(["z", "y", "x"]);
  });

  it("honours the count and copes with nothing else", () => {
    expect(relatedPosts(current, others, 1).map((p) => p.slug)).toEqual(["z"]);
    expect(relatedPosts(current, [current])).toEqual([]);
  });
});

describe("articleSheets", () => {
  it("counts top-level sections between 2 and 8", () => {
    expect(articleSheets([])).toBe(2);
    expect(articleSheets([{ level: 2 }, { level: 3 }, { level: 3 }])).toBe(2);
    expect(articleSheets([{ level: 2 }, { level: 2 }, { level: 2 }, { level: 3 }])).toBe(3);
    expect(articleSheets(Array.from({ length: 11 }, () => ({ level: 2 as const })))).toBe(8);
  });
});
