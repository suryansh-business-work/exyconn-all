// @vitest-environment jsdom
/** Attaching pictures and clips to a live message: pick, preview, remove, send. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Composer } from "../../../../../../src/components/chat-embed/components/composer/Composer";
import { useRecorder } from "../../../../../../src/components/chat-embed/hooks/useRecorder";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions } from "../../chat-fixtures";

vi.mock("../../../../../../src/components/chat-embed/hooks/useRecorder", () => ({
  useRecorder: vi.fn(),
}));

function mount() {
  const actions = makeActions();
  const view = renderInChatTheme(
    <Composer channel="LIVE" actions={actions} allowUploads maxUploadMb={5} />
  );
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error("the file input is missing");
  }
  return { ...view, actions, input };
}

function pick(input: HTMLInputElement, ...files: File[]) {
  fireEvent.change(input, { target: { files } });
}

const picture = () => new File(["x"], "photo.png", { type: "image/png" });

beforeEach(() => {
  vi.mocked(useRecorder).mockReturnValue({
    active: false,
    seconds: 0,
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Composer attachments", () => {
  it("opens the file picker for pictures and clips", async () => {
    const { user, input } = mount();
    const click = vi.spyOn(input, "click");
    expect(input).toHaveAttribute("accept", "image/*,video/*");
    expect(input).toHaveAttribute("multiple");
    await user.click(screen.getByRole("button", { name: strings.attach }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("previews a picked picture and sends it without text", async () => {
    const { user, actions, input } = mount();
    pick(input, picture());
    expect(await screen.findByRole("img", { name: "photo.png" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: strings.send }));
    expect(actions.send).toHaveBeenCalledWith("LIVE", "", [
      { name: "photo.png", data: expect.stringMatching(/^data:image\/png;base64,/) },
    ]);
    expect(screen.queryByRole("img", { name: "photo.png" })).not.toBeInTheDocument();
  });

  it("takes no file from a change event that carries none", async () => {
    const { actions, input } = mount();
    fireEvent.change(input, { target: { files: null } });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(actions.showError).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: strings.record })).toBeInTheDocument();
  });

  it("previews a clip with its name", async () => {
    const { container, input } = mount();
    pick(input, new File(["x"], "clip.mp4", { type: "video/mp4" }));
    await waitFor(() =>
      expect(container.querySelector('[aria-label="clip.mp4"]')).toBeInTheDocument()
    );
  });

  it("removes a picked file before sending", async () => {
    const { user, input } = mount();
    pick(input, picture());
    await user.click(await screen.findByRole("button", { name: strings.removeFile("photo.png") }));
    expect(screen.queryByRole("img", { name: "photo.png" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.record })).toBeInTheDocument();
  });

  it("explains a file it cannot take", async () => {
    const { actions, input } = mount();
    pick(input, new File(["x"], "cv.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(actions.showError).toHaveBeenCalledWith(strings.fileType("cv.pdf")));
  });

  it("refuses a fifth file", async () => {
    const { actions, input } = mount();
    const five = ["1", "2", "3", "4", "5"].map(
      (name) => new File(["x"], `${name}.png`, { type: "image/png" })
    );
    pick(input, ...five);
    await waitFor(() => expect(actions.showError).toHaveBeenCalledWith(strings.tooManyFiles));
  });

  it("logs a pick that fails unexpectedly instead of breaking the chat", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { actions, input } = mount();
    actions.showError.mockImplementation(() => {
      throw new Error("toast failed");
    });
    pick(input, new File(["x"], "cv.pdf", { type: "application/pdf" }));
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith("[chat] attach failed", expect.any(Error))
    );
  });
});
