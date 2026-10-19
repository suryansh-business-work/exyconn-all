// @vitest-environment jsdom
/** The security question: loaded when a dialog opens, reloaded on demand, and its failure shown. */
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { CaptchaInput } from "../../../../../../src/components/gcc/calculator/dialogs/captcha/CaptchaInput";
import { useCaptcha } from "../../../../../../src/components/gcc/calculator/dialogs/captcha/useCaptcha";
import { renderWithUser } from "../../../../test-utils";

const captcha = vi.hoisted(() => ({ fetchCaptcha: vi.fn() }));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => captcha);

afterEach(() => vi.restoreAllMocks());

describe("useCaptcha", () => {
  it("loads a question only while active", async () => {
    captcha.fetchCaptcha.mockResolvedValue({ token: "t-1", question: "2 + 3" });
    const { result, rerender } = renderHook(({ active }) => useCaptcha(active), {
      initialProps: { active: false },
    });
    expect(captcha.fetchCaptcha).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ token: "", question: "", failed: false });
    rerender({ active: true });
    await waitFor(() =>
      expect(result.current).toMatchObject({ token: "t-1", question: "2 + 3", failed: false })
    );
  });

  it("marks a failed load, and a reload recovers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    captcha.fetchCaptcha.mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useCaptcha(true));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.token).toBe("");
    captcha.fetchCaptcha.mockResolvedValueOnce({ token: "t-2", question: "4 + 4" });
    await act(() => result.current.reload());
    expect(result.current).toMatchObject({ token: "t-2", question: "4 + 4", failed: false });
  });
});

function Field({
  question,
  failed = false,
  error,
  onReload,
}: Readonly<{ question: string; failed?: boolean; error?: string; onReload: () => void }>) {
  const { register } = useForm<{ answer: string }>();
  return (
    <CaptchaInput
      captcha={{ token: "t", question, failed }}
      registration={register("answer")}
      error={error}
      onReload={onReload}
    />
  );
}

describe("CaptchaInput", () => {
  it("asks the question as its label and fetches a new one on request", async () => {
    const onReload = vi.fn();
    const { user } = renderWithUser(<Field question="2 + 3" onReload={onReload} />);
    const field = screen.getByRole("textbox", { name: /Security question: 2 \+ 3/ });
    expect(field).toBeRequired();
    expect(field).toHaveAttribute("autocomplete", "off");
    await user.click(screen.getByRole("button", { name: "New security question" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("says it is loading until a question arrives", () => {
    renderWithUser(<Field question="" onReload={vi.fn()} />);
    expect(
      screen.getByRole("textbox", { name: /Loading the security question/ })
    ).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows a load failure, and a field error ahead of it", () => {
    const { unmount } = renderWithUser(<Field question="" failed onReload={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(
      screen.getByText("The security question could not be loaded. Try again.")
    ).toBeInTheDocument();
    unmount();
    renderWithUser(<Field question="2 + 3" failed error="Required" onReload={vi.fn()} />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText(/could not be loaded/)).toBeNull();
  });
});
