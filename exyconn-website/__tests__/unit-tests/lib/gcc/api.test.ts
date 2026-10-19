import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createShareLink,
  emailEstimate,
  fetchCurrencies,
  fetchFxRates,
  readSharedEstimate,
  revokeShareLink,
} from "../../../../src/lib/gcc/api";
import { estimate } from "./estimate-fixture";

const fetchMock = vi.fn<typeof fetch>();
const captcha = { token: "q-1", answer: "7" };
const TOKEN = "a".repeat(64);

const answer = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

const sentBody = (call = 0) =>
  JSON.parse(String(fetchMock.mock.calls[call][1]?.body)) as Record<string, unknown>;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("emailing an estimate", () => {
  const send = () =>
    emailEstimate({ to: "dana@globex.com", estimate: estimate(), note: "Hi", captcha });

  it("posts the estimate with the captcha answer and reports where it went", async () => {
    fetchMock.mockResolvedValue(answer(200, { sentTo: "dana@globex.com" }));

    expect(await send()).toEqual({ ok: true, sentTo: "dana@globex.com" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/gcc/email");
    expect(sentBody()).toEqual({
      to: "dana@globex.com",
      estimate: estimate(),
      note: "Hi",
      captchaToken: "q-1",
      captchaAnswer: "7",
    });
  });

  it("is unavailable when the server fails, with the server's sentence when it gave one", async () => {
    fetchMock.mockResolvedValueOnce(
      answer(503, { error: "unavailable", message: "Email is down." })
    );
    expect(await send()).toEqual({ ok: false, reason: "unavailable", message: "Email is down." });

    fetchMock.mockResolvedValueOnce(answer(502, "<html>Bad gateway</html>"));
    const gateway = await send();
    expect(gateway.ok === false && gateway.reason).toBe("unavailable");
  });

  it("is unavailable, without throwing, when the network fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await send();

    expect(result.ok === false && result.reason).toBe("unavailable");
    expect(result.ok === false && result.message).not.toBe("");
  });

  it("says when the visitor is going too fast", async () => {
    fetchMock.mockResolvedValue(answer(429, { error: "rate-limited", message: "Slow down." }));

    expect(await send()).toEqual({ ok: false, reason: "rate-limited", message: "Slow down." });
  });

  it("passes on a wrong captcha answer and a refused field", async () => {
    fetchMock.mockResolvedValueOnce(
      answer(400, { error: "captcha", message: "Try the new question." })
    );
    expect(await send()).toEqual({
      ok: false,
      reason: "captcha",
      message: "Try the new question.",
    });

    fetchMock.mockResolvedValueOnce(answer(400, { error: "something-else" }));
    const refused = await send();
    expect(refused.ok === false && refused.reason).toBe("invalid");
  });

  it("is unavailable when a success answer has no readable body", async () => {
    fetchMock.mockResolvedValue(answer(200, "not json"));

    const result = await send();

    expect(result.ok === false && result.reason).toBe("unavailable");
  });
});

describe("share links", () => {
  it("creates a link with the visitor's consent", async () => {
    const link = { token: TOKEN, revokeKey: "b".repeat(64), expiresAt: "2026-10-21T00:00:00.000Z" };
    fetchMock.mockResolvedValue(answer(200, link));

    expect(await createShareLink({ estimate: estimate(), expiresInDays: 7, captcha })).toEqual({
      ok: true,
      ...link,
    });
    expect(sentBody()).toMatchObject({ action: "create", consent: true, expiresInDays: 7 });
  });

  it("reads a shared estimate and checks it against the schema", async () => {
    const expiresAt = "2026-10-21T00:00:00.000Z";
    fetchMock.mockResolvedValueOnce(
      answer(200, { estimateJson: JSON.stringify(estimate()), expiresAt })
    );
    expect(await readSharedEstimate(TOKEN)).toEqual({ ok: true, estimate: estimate(), expiresAt });

    fetchMock.mockResolvedValueOnce(
      answer(200, { estimateJson: JSON.stringify({ ...estimate(), name: "" }), expiresAt })
    );
    const tampered = await readSharedEstimate(TOKEN);
    expect(tampered.ok === false && tampered.reason).toBe("invalid");
  });

  it("reports a link that has gone", async () => {
    fetchMock.mockResolvedValue(
      answer(404, { error: "not-found", message: "This link has expired." })
    );

    expect(await readSharedEstimate(TOKEN)).toEqual({
      ok: false,
      reason: "not-found",
      message: "This link has expired.",
    });
  });

  it("revokes a link with its key", async () => {
    fetchMock.mockResolvedValue(answer(200, {}));

    expect(await revokeShareLink(TOKEN, "b".repeat(64))).toEqual({ ok: true });
    expect(sentBody()).toEqual({ action: "revoke", token: TOKEN, revokeKey: "b".repeat(64) });
  });
});

describe("reference exchange rates", () => {
  const usd = {
    currency: "USD",
    inrPerUnit: 83.25,
    source: "European Central Bank reference rate (Frankfurter)",
    asOf: "2026-10-14",
    userProvided: false,
  };

  it("asks for the currencies and returns the validated rates", async () => {
    fetchMock.mockResolvedValue(answer(200, { rates: [usd] }));

    expect(await fetchFxRates(["USD", "GBP"])).toEqual({ ok: true, rates: [usd] });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/gcc/fx-rates?currencies=USD%2CGBP");
  });

  it("is unavailable when the rates do not hold up", async () => {
    fetchMock.mockResolvedValue(answer(200, { rates: [{ ...usd, inrPerUnit: -1 }] }));

    const result = await fetchFxRates(["USD"]);

    expect(result.ok === false && result.reason).toBe("unavailable");
  });
});

describe("default sentences and failed calls", () => {
  const send = () =>
    emailEstimate({ to: "dana@globex.com", estimate: estimate(), note: "", captcha });

  it("falls back to its own sentence when the server gives none", async () => {
    fetchMock.mockResolvedValueOnce(answer(429, {}));
    expect(await send()).toEqual({
      ok: false,
      reason: "rate-limited",
      message: "Too many requests. Please wait a few minutes and try again.",
    });
    fetchMock.mockResolvedValueOnce(answer(404, { error: "not-found" }));
    expect(await send()).toEqual({
      ok: false,
      reason: "not-found",
      message: "The request could not be completed. Check the details and try again.",
    });
  });

  it("reads a JSON answer that is not an object as no body", async () => {
    fetchMock.mockResolvedValueOnce(answer(200, "null"));
    expect((await send()).ok).toBe(false);
    fetchMock.mockResolvedValueOnce(answer(400, '"refused"'));
    expect(await send()).toEqual({
      ok: false,
      reason: "invalid",
      message: "The request could not be completed. Check the details and try again.",
    });
  });

  it("passes a failure through from every call", async () => {
    // A fresh answer each time: a body can be read only once.
    fetchMock.mockImplementation(async () => answer(503, { message: "Down." }));
    const down = { ok: false, reason: "unavailable", message: "Down." };
    expect(await createShareLink({ estimate: estimate(), expiresInDays: 7, captcha })).toEqual(
      down
    );
    expect(await revokeShareLink(TOKEN, "b".repeat(64))).toEqual(down);
    expect(await fetchFxRates(["USD"])).toEqual(down);
    expect(await fetchCurrencies()).toEqual(down);
  });
});

describe("the currency list", () => {
  it("returns the 3-letter codes the server lists", async () => {
    fetchMock.mockResolvedValue(answer(200, { currencies: ["AED", "INR", "USD"] }));
    expect(await fetchCurrencies()).toEqual({ ok: true, currencies: ["AED", "INR", "USD"] });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/gcc/fx-currencies");
  });

  it.each([
    ["not a list", { currencies: "USD" }],
    ["a code that is not text", { currencies: ["USD", 3] }],
    ["a code of the wrong length", { currencies: ["USD", "EURO"] }],
  ])("is unavailable when the list is %s", async (_what, body) => {
    fetchMock.mockResolvedValue(answer(200, body));
    const result = await fetchCurrencies();
    expect(result.ok === false && result.reason).toBe("unavailable");
  });
});
