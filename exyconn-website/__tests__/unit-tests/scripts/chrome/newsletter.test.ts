// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captcha = vi.hoisted(() => ({ mountCaptcha: vi.fn(), send: vi.fn() }));
vi.mock("../../../../src/lib/captcha-dom", () => ({ mountCaptcha: captcha.mountCaptcha }));

const FORM = `
  <form id="newsletter-form">
    <input id="newsletter-email" />
    <button id="newsletter-btn" type="submit">Subscribe</button>
    <p id="newsletter-success" hidden></p>
    <p id="newsletter-error" hidden></p>
  </form>
`;

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const email = () => byId<HTMLInputElement>("newsletter-email");
const button = () => byId<HTMLButtonElement>("newsletter-btn");

const boot = async (html = FORM) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../../src/scripts/chrome/newsletter");
};

const submit = async (): Promise<Event> => {
  const event = new Event("submit", { cancelable: true });
  byId("newsletter-form").dispatchEvent(event);
  await settle();
  return event;
};

beforeEach(() => {
  captcha.mountCaptcha.mockReturnValue({ send: captcha.send, setError: vi.fn() });
});

afterEach(() => {
  vi.restoreAllMocks();
  captcha.mountCaptcha.mockReset();
  captcha.send.mockReset();
});

describe("footer newsletter", () => {
  it("mounts the footer's security question", async () => {
    await boot();
    expect(captcha.mountCaptcha).toHaveBeenCalledWith(document, "newsletter");
  });

  it("does not send an empty address", async () => {
    await boot();
    email().value = "   ";
    expect((await submit()).defaultPrevented).toBe(true);
    expect(captcha.send).not.toHaveBeenCalled();
  });

  it("sends the trimmed address, confirms it and clears the field", async () => {
    let busyDuringSend = "";
    captcha.send.mockImplementation(async () => {
      busyDuringSend = `${button().disabled}:${button().dataset.busy}`;
      return "sent";
    });
    await boot();
    email().value = " asha@example.com ";
    await submit();
    expect(captcha.send).toHaveBeenCalledWith("newsletter", { email: "asha@example.com" });
    expect(busyDuringSend).toBe("true:true");
    expect(byId("newsletter-success").hidden).toBe(false);
    expect(email().value).toBe("");
    expect(button().disabled).toBe(false);
    expect(button().dataset.busy).toBe("false");
  });

  it("keeps the address when the security answer was wrong", async () => {
    captcha.send.mockResolvedValue("captcha");
    await boot();
    email().value = "asha@example.com";
    await submit();
    expect(byId("newsletter-success").hidden).toBe(true);
    expect(email().value).toBe("asha@example.com");
  });

  it("shows the error note and logs when sending fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cause = new Error("offline");
    captcha.send.mockRejectedValue(cause);
    await boot();
    email().value = "asha@example.com";
    await submit();
    expect(byId("newsletter-error").hidden).toBe(false);
    expect(logged).toHaveBeenCalledWith("Newsletter sign-up failed", cause);
    expect(button().disabled).toBe(false);
  });

  it("leaves the form to the browser when the security question is missing", async () => {
    captcha.mountCaptcha.mockReturnValue(null);
    await boot();
    email().value = "asha@example.com";
    expect((await submit()).defaultPrevented).toBe(false);
  });

  it.each([
    ["the form is not a form", FORM.replace("<form", "<div").replace("</form>", "</div>")],
    [
      "the field is not an input",
      FORM.replace(
        '<input id="newsletter-email" />',
        '<textarea id="newsletter-email"></textarea>'
      ),
    ],
    [
      "the button is not a button",
      FORM.replace(/<button([^>]*)>Subscribe<\/button>/, "<span$1>Subscribe</span>"),
    ],
    ["the success note is missing", FORM.replace('<p id="newsletter-success" hidden></p>', "")],
    ["the error note is missing", FORM.replace('<p id="newsletter-error" hidden></p>', "")],
  ])("does not wire the form when %s", async (_case, html) => {
    await boot(html);
    expect((await submit()).defaultPrevented).toBe(false);
    expect(captcha.send).not.toHaveBeenCalled();
  });
});
