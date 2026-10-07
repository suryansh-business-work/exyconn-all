// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captcha = vi.hoisted(() => ({ mountCaptcha: vi.fn(), send: vi.fn() }));
vi.mock("../../../src/lib/captcha-dom", () => ({ mountCaptcha: captcha.mountCaptcha }));

const FORM = `
  <form data-newsletter-signup="footer" data-invalid-email="Enter a valid email">
    <input name="name" />
    <input name="email" />
    <p data-email-error hidden></p>
    <button type="submit">Join</button>
    <p data-signup-success hidden></p>
    <p data-signup-failure hidden></p>
  </form>
`;

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const part = <T extends HTMLElement>(selector: string): T =>
  document.querySelector<T>(selector) as T;
const form = () => part<HTMLFormElement>("form");
const email = () => part<HTMLInputElement>('input[name="email"]');
const button = () => part<HTMLButtonElement>("button");
const error = () => part<HTMLElement>("[data-email-error]");
const success = () => part<HTMLElement>("[data-signup-success]");
const failure = () => part<HTMLElement>("[data-signup-failure]");

const boot = async (html = FORM) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../src/scripts/newsletter-signup");
};

const submit = async (): Promise<Event> => {
  const event = new Event("submit", { cancelable: true });
  form().dispatchEvent(event);
  await settle();
  return event;
};

const fill = (name: string, address: string) => {
  part<HTMLInputElement>('input[name="name"]').value = name;
  email().value = address;
};

beforeEach(() => {
  captcha.mountCaptcha.mockReturnValue({ send: captcha.send, setError: vi.fn() });
});

afterEach(() => {
  vi.restoreAllMocks();
  captcha.mountCaptcha.mockReset();
  captcha.send.mockReset();
  document.body.innerHTML = "";
});

describe("newsletter sign-up", () => {
  it("mounts the form's security question against the subscribe endpoint", async () => {
    await boot();
    expect(captcha.mountCaptcha).toHaveBeenCalledWith(
      form(),
      "footer",
      "/api/newsletter-subscribe"
    );
  });

  it("stops on an invalid address, shows the form's message and focuses the field", async () => {
    await boot();
    fill("Asha", "not-an-email");
    const event = await submit();
    expect(event.defaultPrevented).toBe(true);
    expect(error().textContent).toBe("Enter a valid email");
    expect(error().hidden).toBe(false);
    expect(email().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(email());
    expect(captcha.send).not.toHaveBeenCalled();
  });

  it("shows an empty message when the form names none", async () => {
    await boot(FORM.replace(' data-invalid-email="Enter a valid email"', ""));
    fill("", "");
    await submit();
    expect(error().textContent).toBe("");
    expect(error().hidden).toBe(false);
  });

  it("sends the trimmed address with the page it came from and confirms it", async () => {
    let busyDuringSend: string | undefined;
    captcha.send.mockImplementation(async () => {
      busyDuringSend = `${button().disabled}:${button().dataset.busy}`;
      return "sent";
    });
    await boot();
    fill("  Asha  ", "  asha@example.com ");
    await submit();
    expect(captcha.send).toHaveBeenCalledWith("newsletter", {
      email: "asha@example.com",
      name: "Asha",
      source: "/",
    });
    expect(busyDuringSend).toBe("true:true");
    expect(success().hidden).toBe(false);
    expect(failure().hidden).toBe(true);
    expect(email().value).toBe("");
    expect(email().getAttribute("aria-invalid")).toBe("false");
    expect(error().hidden).toBe(true);
    expect(button().disabled).toBe(false);
    expect(button().dataset.busy).toBe("false");
  });

  it("keeps the form filled when the security answer was wrong", async () => {
    captcha.send.mockResolvedValue("captcha");
    await boot();
    fill("Asha", "asha@example.com");
    await submit();
    expect(success().hidden).toBe(true);
    expect(email().value).toBe("asha@example.com");
    expect(button().disabled).toBe(false);
  });

  it("shows the failure note and logs when the request fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cause = new Error("offline");
    captcha.send.mockRejectedValue(cause);
    await boot();
    fill("Asha", "asha@example.com");
    await submit();
    expect(failure().hidden).toBe(false);
    expect(success().hidden).toBe(true);
    expect(logged).toHaveBeenCalledWith("Newsletter sign-up failed", cause);
    expect(button().dataset.busy).toBe("false");
  });

  it("logs a failure that happens before the request instead of leaving it unhandled", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await boot();
    const broken = new Error("focus failed");
    vi.spyOn(email(), "focus").mockImplementation(() => {
      throw broken;
    });
    fill("Asha", "bad");
    await submit();
    expect(logged).toHaveBeenCalledWith(broken);
  });

  it("leaves a form alone when its security question is missing", async () => {
    captcha.mountCaptcha.mockReturnValue(null);
    await boot();
    expect((await submit()).defaultPrevented).toBe(false);
  });

  it.each([
    ["name field", '<input name="name" />'],
    ["email field", '<input name="email" />'],
    ["email error", "<p data-email-error hidden></p>"],
    ["submit button", '<button type="submit">Join</button>'],
    ["success note", "<p data-signup-success hidden></p>"],
    ["failure note", "<p data-signup-failure hidden></p>"],
  ])("leaves a form alone when its %s is missing", async (_part, markup) => {
    await boot(FORM.replace(markup, ""));
    expect((await submit()).defaultPrevented).toBe(false);
    expect(captcha.send).not.toHaveBeenCalled();
  });
});
