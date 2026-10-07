// @vitest-environment jsdom
/** Step two of the live WhatsApp demo: the emailed code opens the demo. */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoCodeStep } from "../../../../../src/components/forms/whatsapp-demo";
import { renderWithUser } from "../../../test-utils";
import { type FakeReply, postedTo, reply, serveSite } from "../forms.helpers";

const VERIFY_ROUTE = "/api/whatsapp-demo/verify";
const PASS = { token: "pass-1", demoUrl: "https://demo.example", visitor: { name: "Meera Iyer" } };

function setup(post: () => FakeReply | Promise<FakeReply> = () => reply(200, PASS)) {
  const fetchMock = serveSite(post);
  const onVerified = vi.fn();
  const onStartOver = vi.fn();
  const view = renderWithUser(
    <DemoCodeStep email="meera@example.com" onVerified={onVerified} onStartOver={onStartOver} />
  );
  return {
    ...view,
    fetchMock,
    onVerified,
    onStartOver,
    input: screen.getByLabelText(/^Code from the email/),
  };
}

const open = () => screen.getByRole("button", { name: "Open the live demo" });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DemoCodeStep", () => {
  it("says where the code went and focuses the code box", () => {
    const { input } = setup();
    expect(screen.getByRole("status")).toHaveTextContent("meera@example.com");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("maxlength", "6");
  });

  it("wants six digits before it asks the server", async () => {
    const { user, input, fetchMock } = setup();
    await user.type(input, "123");
    await user.click(open());
    expect(await screen.findByText("Enter the six-digit code from the email")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(postedTo(fetchMock, VERIFY_ROUTE)).toEqual([]);
  });

  it("opens the demo with the pass the code was exchanged for", async () => {
    const { user, input, fetchMock, onVerified } = setup();
    await user.type(input, "123456");
    await user.click(open());
    await waitFor(() =>
      expect(onVerified).toHaveBeenCalledWith({
        token: "pass-1",
        demoUrl: "https://demo.example",
        name: "Meera Iyer",
      })
    );
    expect(postedTo(fetchMock, VERIFY_ROUTE)).toEqual([
      { email: "meera@example.com", code: "123456" },
    ]);
  });

  it("shows the server's words for a wrong code, and clears them on the next try", async () => {
    let calls = 0;
    const { user, input, onVerified } = setup(() => {
      calls += 1;
      return calls === 1 ? reply(401, { message: "That code is not right." }) : reply(200, PASS);
    });
    await user.type(input, "000000");
    await user.click(open());
    expect(await screen.findByText("That code is not right.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onVerified).not.toHaveBeenCalled();
    await user.click(open());
    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("That code is not right.")).not.toBeInTheDocument();
  });

  it("shows a general message when the request itself fails", async () => {
    const { user, input } = setup(() => Promise.reject(new TypeError("offline")));
    await user.type(input, "123456");
    await user.click(open());
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });

  it("goes back to step one on request", async () => {
    const { user, onStartOver } = setup();
    await user.click(
      screen.getByRole("button", { name: "Use a different email or send a new code" })
    );
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
