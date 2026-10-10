import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ safeRequest: vi.fn() }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import routes from "../routes";
import { extractContacts } from "../services";

const html = (body: string, head = "") => ({
  data: `<html><head>${head}</head><body>${body}</body></html>`,
});

beforeEach(() => {
  mocks.safeRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  // The scanner waits half a second between pages to be polite; tests need not.
  vi.stubGlobal("setTimeout", (fn: () => void) => {
    fn();
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("extractContacts", () => {
  it("collects emails, phones, social links and addresses from one page", async () => {
    mocks.safeRequest.mockResolvedValue(
      html(
        `<p>Write to sales@acme.io or Support@Acme.co.uk, not test@acme.io or a@example.com.
         Bad: @nolocal.com and x@nodot and y@host.c</p>
         <p>Call +1 415-555-0198 or 020 7946 0958, ref 12345.</p>
         <a href="https://www.facebook.com/acme">f</a>
         <a href="https://x.com/acme">t</a>
         <a href="https://linkedin.com/company/acme-inc">l</a>
         <a href="https://instagram.com/acme.io">i</a>
         <a href="https://youtube.com/channel/UC123">y</a>
         <address>  1 Main   Street,
           Springfield  </address><address>short</address>`,
        "<title> Acme </title>",
      ),
    );

    const result = await extractContacts("https://acme.io", 1, false);

    expect(result.pagesScanned).toBe(1);
    expect(result.totalEmails).toEqual(["sales@acme.io", "Support@Acme.co.uk"]);
    expect(result.totalPhones).toEqual(["+1 415-555-0198", "020 7946 0958"]);
    expect(result.socialLinks).toEqual({
      facebook: "https://www.facebook.com/acme",
      twitter: "https://x.com/acme",
      linkedin: "https://linkedin.com/company/acme-inc",
      instagram: "https://instagram.com/acme.io",
      youtube: "https://youtube.com/channel/UC123",
    });
    expect(result.pages[0]).toMatchObject({
      url: "https://acme.io",
      title: "Acme",
    });
    expect(result.pages[0].contacts.addresses).toEqual([
      "1 Main Street, Springfield",
    ]);
  });

  it("follows internal links up to the page limit, skipping files, hashes and other sites", async () => {
    const pages: Record<string, string> = {
      "https://acme.io/": `<a href="/about">About</a><a href="/logo.png">img</a><a href="mailto:a@acme.io">m</a>
        <a href="https://other.test/x">ext</a><a href="/about#team">again</a><a href="/#">top</a>
        <a href="http://">broken</a><a href="">empty</a><a href="/contact">Contact</a>`,
      "https://acme.io/about": `<a href="/">home</a><a href="/contact">c</a>`,
      "https://acme.io/contact": "<p>hello@acme.io</p>",
    };
    mocks.safeRequest.mockImplementation(async (url: string) =>
      html(pages[url] ?? ""),
    );

    const result = await extractContacts("https://acme.io/", 10, true);

    expect(result.pages.map((page) => page.url)).toEqual([
      "https://acme.io/",
      "https://acme.io/about",
      "https://acme.io/contact",
    ]);
    expect(result.pages[0].title).toBe("https://acme.io/");
    expect(result.totalEmails).toEqual(["hello@acme.io"]);
  });

  it("stops queueing at the page limit and does not follow links when told not to", async () => {
    mocks.safeRequest.mockResolvedValue(
      html('<a href="/a">a</a><a href="/b">b</a>'),
    );

    const limited = await extractContacts("https://acme.io", 2, true);
    expect(limited.pagesScanned).toBe(2);

    mocks.safeRequest.mockClear();
    const single = await extractContacts("https://acme.io", 5, false);
    expect(single.pagesScanned).toBe(1);
    expect(mocks.safeRequest).toHaveBeenCalledTimes(1);
  });

  it("skips a page that cannot be fetched and reports the rest", async () => {
    mocks.safeRequest
      .mockResolvedValueOnce(
        html('<a href="/down">down</a><a href="/up">up</a>'),
      )
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(html("<p>ok@acme.io</p>"));

    const result = await extractContacts("https://acme.io", 5, true);

    expect(result.pages.map((page) => page.url)).toEqual([
      "https://acme.io",
      "https://acme.io/up",
    ]);
    expect(result.pagesScanned).toBe(3);
    expect(result.totalEmails).toEqual(["ok@acme.io"]);
  });

  it("keeps the first social link found across pages", async () => {
    mocks.safeRequest
      .mockResolvedValueOnce(
        html('<a href="/next">n</a><a href="https://facebook.com/first">f</a>'),
      )
      .mockResolvedValueOnce(
        html(
          '<a href="https://facebook.com/second">f</a><a href="https://x.com/later">t</a>',
        ),
      );

    const result = await extractContacts("https://acme.io", 2, true);

    expect(result.socialLinks).toEqual({
      facebook: "https://facebook.com/first",
      twitter: "https://x.com/later",
    });
  });
});

describe("POST /extract", () => {
  const app = mountRouter(routes);

  it("validates the body and applies the defaults", async () => {
    mocks.safeRequest.mockResolvedValue(html("<p>hi@acme.io</p>"));

    const bad = await request(app).post("/extract").send({ url: "nope" });
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({
      success: false,
      error: "Validation failed",
    });

    const ok = await request(app)
      .post("/extract")
      .send({ url: "https://acme.io" });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({
      baseUrl: "https://acme.io",
      totalEmails: ["hi@acme.io"],
    });
  });

  it("answers 500 with a fixed message when scanning fails", async () => {
    mocks.safeRequest.mockResolvedValue({ data: "<html>" });
    vi.stubGlobal("setTimeout", () => {
      throw new Error("timer broke");
    });

    const res = await request(app)
      .post("/extract")
      .send({ url: "https://acme.io" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: "Failed to extract contacts",
    });
  });
});
