/** The live demo's two steps against the site's API, and the demo forms' rules. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DemoStepError,
  checkDemoCode,
  sendDemoCode,
} from "../../../../../src/components/forms/whatsapp-demo/demoApi";
import {
  demoCodeSchema,
  demoLeadSchema,
} from "../../../../../src/components/forms/whatsapp-demo/whatsapp-demo.schema";
import { postedTo, reply, serveSite } from "../forms.helpers";

afterEach(() => vi.unstubAllGlobals());

describe("sendDemoCode", () => {
  it("posts the lead to the code route", async () => {
    const fetchMock = serveSite(() => reply(200, { ok: true }));
    await expect(sendDemoCode({ name: "Meera", email: "m@example.com" })).resolves.toBeUndefined();
    expect(postedTo(fetchMock, "/api/whatsapp-demo/code")).toEqual([
      { name: "Meera", email: "m@example.com" },
    ]);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("throws the route's message, flagged when the captcha was refused", async () => {
    serveSite(() => reply(400, { error: "captcha", message: "Wrong answer" }));
    const error = await sendDemoCode({}).catch((error_: unknown) => error_);
    expect(error).toBeInstanceOf(DemoStepError);
    expect(error).toMatchObject({ name: "DemoStepError", message: "Wrong answer", captcha: true });
  });

  it("throws a general message when the failure has no JSON body", async () => {
    serveSite(() => reply(502));
    const error = await sendDemoCode({}).catch((error_: unknown) => error_);
    expect(error).toMatchObject({
      message: "Something went wrong. Please try again.",
      captcha: false,
    });
  });
});

describe("checkDemoCode", () => {
  it("exchanges the code for the demo pass", async () => {
    const fetchMock = serveSite(() =>
      reply(200, { token: "pass", demoUrl: "https://demo.example", visitor: { name: "Meera" } })
    );
    await expect(checkDemoCode("m@example.com", "123456")).resolves.toEqual({
      token: "pass",
      demoUrl: "https://demo.example",
      name: "Meera",
    });
    expect(postedTo(fetchMock, "/api/whatsapp-demo/verify")).toEqual([
      { email: "m@example.com", code: "123456" },
    ]);
  });

  it("throws the route's message for a wrong code", async () => {
    serveSite(() => reply(401, { message: "That code is not right." }));
    await expect(checkDemoCode("m@example.com", "000000")).rejects.toMatchObject({
      message: "That code is not right.",
      captcha: false,
    });
  });
});

describe("demo schemas", () => {
  const lead = { name: " Meera ", email: "m@example.com", company: "", phone: "", captcha: "4" };

  it("accepts a lead with the optional fields blank, trimmed", () => {
    expect(demoLeadSchema.parse(lead)).toMatchObject({ name: "Meera", phone: "" });
  });

  it("requires a name and a work email, and checks a typed phone", () => {
    const result = demoLeadSchema.safeParse({ ...lead, name: " ", email: "", phone: "abc" });
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining(["Your name is required", "Work email is required"])
    );
    expect(result.error?.issues.some((issue) => issue.path[0] === "phone")).toBe(true);
  });

  it("wants exactly six digits for the code", () => {
    expect(demoCodeSchema.parse({ code: " 123456 " })).toEqual({ code: "123456" });
    expect(demoCodeSchema.safeParse({ code: "12345" }).error?.issues[0]?.message).toBe(
      "Enter the six-digit code from the email"
    );
  });
});
