// @vitest-environment jsdom
/** The live WhatsApp demo flow: details, the emailed code, then the demo itself. */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsappDemoAccess } from "../../../../../src/components/forms/whatsapp-demo";
import { WhatsappDemoLive } from "../../../../../src/components/forms/whatsapp-demo/WhatsappDemoLive";
import { renderWithUser } from "../../../test-utils";
import { reply, serveSite } from "../forms.helpers";

const KEY = "exyconn.whatsappDemo.access";
const ACCESS = { token: "pass-1", demoUrl: "https://demo.example/", name: "Meera Iyer" };
const CHATS_URL = "https://demo.example/whatsapp-demo#visitor=pass-1";

/** The code route accepts the lead; the verify route hands out the pass. */
const serveDemo = () =>
  serveSite((url) =>
    url === "/api/whatsapp-demo/verify"
      ? reply(200, { token: ACCESS.token, demoUrl: ACCESS.demoUrl, visitor: { name: ACCESS.name } })
      : reply(200, {})
  );

afterEach(() => {
  globalThis.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsappDemoAccess", () => {
  it("takes a new visitor from the lead form through the code to the live demo, and out again", async () => {
    serveDemo();
    const { user } = renderWithUser(<WhatsappDemoAccess />);
    await screen.findByText("1 + 1 = ?");
    await user.type(screen.getByLabelText(/^Your name/), "Meera Iyer");
    await user.type(screen.getByLabelText(/^Work email/), "meera@example.com");
    await user.type(screen.getByLabelText(/^Security Check/), "2");
    await user.click(screen.getByRole("button", { name: "Email me my demo code" }));

    expect(await screen.findByRole("form", { name: "Enter your demo code" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("meera@example.com");
    await user.type(screen.getByLabelText(/^Code from the email/), "123456");
    await user.click(screen.getByRole("button", { name: "Open the live demo" }));

    const frame = await screen.findByTitle("Exyconn WhatsApp automation — live demo");
    expect(frame).toHaveAttribute("src", CHATS_URL);
    expect(JSON.parse(globalThis.localStorage.getItem(KEY) ?? "null")).toEqual(ACCESS);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("form", { name: "Request live demo access" })
    ).toBeInTheDocument();
    expect(globalThis.localStorage.getItem(KEY)).toBeNull();
  });

  it("goes back to the lead form from the code step", async () => {
    serveDemo();
    const { user } = renderWithUser(<WhatsappDemoAccess />);
    await screen.findByText("1 + 1 = ?");
    await user.type(screen.getByLabelText(/^Your name/), "Meera");
    await user.type(screen.getByLabelText(/^Work email/), "meera@example.com");
    await user.type(screen.getByLabelText(/^Security Check/), "2");
    await user.click(screen.getByRole("button", { name: "Email me my demo code" }));
    await user.click(
      await screen.findByRole("button", { name: "Use a different email or send a new code" })
    );
    expect(
      await screen.findByRole("form", { name: "Request live demo access" })
    ).toBeInTheDocument();
  });

  it("opens the demo straight away for a visitor who verified before", async () => {
    serveDemo();
    globalThis.localStorage.setItem(KEY, JSON.stringify(ACCESS));
    render(<WhatsappDemoAccess />);
    expect(await screen.findByText(/Live demo, Meera/)).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});

describe("WhatsappDemoLive", () => {
  it("greets the visitor by first name and links to the demo full screen", async () => {
    const onSignOut = vi.fn();
    const { user } = renderWithUser(<WhatsappDemoLive access={ACCESS} onSignOut={onSignOut} />);
    expect(screen.getByText(/Live demo, Meera —/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Open full screen" });
    expect(link).toHaveAttribute("href", CHATS_URL);
    expect(link).toHaveAttribute("target", "_blank");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("greets without a name when the visitor gave none", () => {
    render(<WhatsappDemoLive access={{ ...ACCESS, name: "" }} onSignOut={vi.fn()} />);
    expect(screen.getByText(/^Live demo — pick an industry/)).toBeInTheDocument();
  });
});
