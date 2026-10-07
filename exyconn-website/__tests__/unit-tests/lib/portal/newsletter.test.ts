import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import {
  getNewsletterIssue,
  getNewsletterIssues,
  subscribeNewsletter,
} from "../../../../src/lib/portal/newsletter";

const summary = {
  id: "n1",
  slug: "october",
  title: "October",
  summary: "What shipped",
  coverImage: "",
  publishedAt: "2026-10-01T00:00:00Z",
};

beforeEach(() => {
  portalRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("newsletter issues", () => {
  it("lists a site's published issues", async () => {
    portalRequest.mockResolvedValue({ publicNewsletterIssues: [summary] });

    await expect(getNewsletterIssues("exyconn")).resolves.toEqual([summary]);
    const [query, variables] = portalRequest.mock.calls[0];
    expect(query).toContain("publicNewsletterIssues(site: $site)");
    expect(query).not.toContain("contentCss");
    expect(variables).toEqual({ site: "exyconn" });
  });

  it("renders an empty list, logged, when the portal fails", async () => {
    portalRequest.mockRejectedValue(new Error("down"));
    await expect(getNewsletterIssues("exyconn")).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Portal getNewsletterIssues failed — rendering without it.",
      expect.any(Error)
    );
  });

  it("reads one issue with its body", async () => {
    const issue = { ...summary, content: "<p>Hi</p>", contentCss: "" };
    portalRequest.mockResolvedValue({ publicNewsletterIssue: issue });

    await expect(getNewsletterIssue("october", "exyconn")).resolves.toEqual(issue);
    const [query, variables] = portalRequest.mock.calls[0];
    expect(query).toContain("content contentCss");
    expect(variables).toEqual({ slug: "october", site: "exyconn" });
  });

  it("is null for an unpublished issue or a portal failure", async () => {
    portalRequest.mockResolvedValueOnce({ publicNewsletterIssue: null });
    await expect(getNewsletterIssue("nope", "exyconn")).resolves.toBeNull();

    portalRequest.mockRejectedValueOnce(new Error("down"));
    await expect(getNewsletterIssue("october", "exyconn")).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "Portal getNewsletterIssue failed — rendering without it.",
      expect.any(Error)
    );
  });
});

describe("newsletter sign-up", () => {
  const signup = { site: "exyconn", email: "reader@example.com", name: "Reader", source: "/blog" };
  const captcha = { token: "question-1", answer: "7" };

  it("sends the sign-up with the captcha answer", async () => {
    portalRequest.mockResolvedValue({ subscribeNewsletter: true });

    await expect(subscribeNewsletter(signup, captcha)).resolves.toBeUndefined();
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("subscribeNewsletter"), {
      input: signup,
      captcha,
    });
  });

  it("lets a refusal reach the caller", async () => {
    const refusal = new Error("Portal request failed: wrong answer");
    portalRequest.mockRejectedValue(refusal);
    await expect(subscribeNewsletter(signup, captcha)).rejects.toBe(refusal);
  });
});
