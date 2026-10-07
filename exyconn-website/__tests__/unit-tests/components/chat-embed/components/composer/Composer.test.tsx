// @vitest-environment jsdom
/** The message box: typing, sending with Enter, the character counter and each thread's own rules. */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Composer } from "../../../../../../src/components/chat-embed/components/composer/Composer";
import { useRecorder } from "../../../../../../src/components/chat-embed/hooks/useRecorder";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { Channel } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions } from "../../chat-fixtures";

vi.mock("../../../../../../src/components/chat-embed/hooks/useRecorder", () => ({
  useRecorder: vi.fn(),
}));

const recorder = { active: false, seconds: 0, start: vi.fn(), stop: vi.fn(), cancel: vi.fn() };

function mount(channel: Channel, allowUploads = false) {
  const actions = makeActions();
  const view = renderInChatTheme(
    <Composer channel={channel} actions={actions} allowUploads={allowUploads} maxUploadMb={5} />
  );
  return { ...view, actions };
}

const box = (section: string) =>
  screen.getByRole("textbox", { name: strings.messageLabel(section) });
const sendButton = () => screen.getByRole("button", { name: strings.send });

beforeEach(() => {
  recorder.active = false;
  recorder.seconds = 0;
  recorder.start.mockClear();
  recorder.stop.mockClear();
  recorder.cancel.mockClear();
  vi.mocked(useRecorder).mockReset();
  vi.mocked(useRecorder).mockReturnValue(recorder);
});

describe("Composer: the live thread", () => {
  it("labels the form and the box after the section", () => {
    mount("LIVE");
    expect(
      screen.getByRole("form", { name: strings.messageLabel(strings.tabLive) })
    ).toBeInTheDocument();
    expect(box(strings.tabLive)).toHaveAttribute("placeholder", strings.placeholderLive);
  });

  it("tells the team the visitor is typing, and stops when they leave the box", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "Hi");
    expect(actions.typed).toHaveBeenCalledTimes(2);
    await user.tab();
    expect(actions.stopTyping).toHaveBeenCalledTimes(1);
  });

  it("sends the trimmed message with Enter and clears the box", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "  Hello team  {Enter}");
    expect(actions.send).toHaveBeenCalledWith("LIVE", "Hello team", []);
    expect(box(strings.tabLive)).toHaveValue("");
  });

  it("starts a new line with Shift+Enter instead of sending", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "one{Shift>}{Enter}{/Shift}two");
    expect(box(strings.tabLive)).toHaveValue("one\ntwo");
    expect(actions.send).not.toHaveBeenCalled();
  });

  it("sends nothing while the box holds only spaces", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "   {Enter}");
    expect(actions.send).not.toHaveBeenCalled();
    expect(sendButton()).toBeDisabled();
  });

  it("leaves Enter to an input method that is still composing", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "nihao");
    fireEvent.keyDown(box(strings.tabLive), { key: "Enter", isComposing: true });
    expect(actions.send).not.toHaveBeenCalled();
    expect(box(strings.tabLive)).toHaveValue("nihao");
  });

  it("sends from the button", async () => {
    const { user, actions } = mount("LIVE");
    await user.type(box(strings.tabLive), "From the button");
    await user.click(sendButton());
    expect(actions.send).toHaveBeenCalledWith("LIVE", "From the button", []);
  });
});

describe("Composer: the Knowledge Bot", () => {
  it("asks without typing notices, uploads or a microphone", async () => {
    const { user, actions } = mount("KNOWLEDGE");
    const field = box(strings.tabKnowledge);
    expect(field).toHaveAttribute("placeholder", strings.placeholderKnowledge);
    expect(screen.queryByRole("button", { name: strings.attach })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.record })).not.toBeInTheDocument();
    await user.type(field, "What do you build?{Enter}");
    await user.tab();
    expect(actions.typed).not.toHaveBeenCalled();
    expect(actions.stopTyping).not.toHaveBeenCalled();
    expect(actions.send).toHaveBeenCalledWith("KNOWLEDGE", "What do you build?", []);
  });
});

describe("Composer: the character limit", () => {
  it("stays quiet until the last 200 characters", () => {
    mount("KNOWLEDGE");
    fireEvent.change(box(strings.tabKnowledge), { target: { value: "a".repeat(1799) } });
    expect(screen.queryByText(/characters left/)).not.toBeInTheDocument();
  });

  it("counts down near the limit and cuts a paste at 2000 characters", () => {
    mount("KNOWLEDGE");
    const field = box(strings.tabKnowledge);
    fireEvent.change(field, { target: { value: "a".repeat(1850) } });
    expect(screen.getByText(strings.charsLeft(150))).toBeInTheDocument();
    fireEvent.change(field, { target: { value: "a".repeat(2100) } });
    expect(field).toHaveValue("a".repeat(2000));
    expect(screen.getByText(strings.charsLeft(0))).toBeInTheDocument();
  });
});

describe("Composer: voice notes", () => {
  it("offers the microphone in place of send while the live box is empty", async () => {
    const { user } = mount("LIVE", true);
    expect(screen.queryByRole("button", { name: strings.send })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: strings.record }));
    expect(recorder.start).toHaveBeenCalledTimes(1);
    await user.type(box(strings.tabLive), "x");
    expect(screen.queryByRole("button", { name: strings.record })).not.toBeInTheDocument();
    expect(sendButton()).toBeEnabled();
  });

  it("swaps to the recording bar while a note records", async () => {
    recorder.active = true;
    recorder.seconds = 7;
    const { user } = mount("LIVE", true);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("timer", { name: strings.recording })).toHaveTextContent("0:07");
    await user.click(screen.getByRole("button", { name: strings.cancelRecording }));
    expect(recorder.cancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: strings.stopSend }));
    expect(recorder.stop).toHaveBeenCalledTimes(1);
  });

  it("sends a finished note on the live thread and reports recorder errors", () => {
    const { actions } = mount("LIVE", true);
    const options = vi.mocked(useRecorder).mock.calls[0][0];
    const note = { name: "voice-note-1.webm", data: "data:audio/webm;base64,AAAA" };
    options.onDone(note);
    expect(actions.send).toHaveBeenCalledWith("LIVE", "", [note]);
    options.onError(strings.micDenied);
    expect(actions.showError).toHaveBeenCalledWith(strings.micDenied);
  });
});
