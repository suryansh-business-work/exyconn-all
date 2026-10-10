import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

import {
  CommandFailedError,
  ToolUnavailableError,
  runCommand,
} from "../services/process";

type FakeChild = EventEmitter & {
  stderr: EventEmitter | null;
  kill: ReturnType<typeof vi.fn>;
};

function child(withStderr = true): FakeChild {
  const fake = new EventEmitter() as FakeChild;
  fake.stderr = withStderr ? new EventEmitter() : null;
  fake.kill = vi.fn();
  mocks.spawn.mockReturnValue(fake);
  return fake;
}

beforeEach(() => {
  mocks.spawn.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runCommand", () => {
  it("resolves when the command exits 0, running the binary directly with its arguments", async () => {
    const fake = child();
    const done = runCommand("qpdf", ["--version"]);

    fake.emit("close", 0);

    await expect(done).resolves.toBeUndefined();
    expect(mocks.spawn).toHaveBeenCalledWith("qpdf", ["--version"]);
  });

  it("rejects with the exit code and what the command wrote to stderr", async () => {
    const fake = child();
    const done = runCommand("qpdf", []);

    fake.stderr?.emit("data", Buffer.from("invalid pass"));
    fake.stderr?.emit("data", Buffer.from("word"));
    fake.emit("close", 2);

    const error = await done.catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(CommandFailedError);
    expect(error).toMatchObject({
      exitCode: 2,
      stderr: "invalid password",
      message: "qpdf exited with code 2",
    });
  });

  it("reports a missing binary as unavailable, and any other spawn error as it is", async () => {
    const missing = child();
    const first = runCommand("soffice", []);
    missing.emit(
      "error",
      Object.assign(new Error("spawn soffice ENOENT"), { code: "ENOENT" }),
    );
    await expect(first).rejects.toBeInstanceOf(ToolUnavailableError);

    const denied = child();
    const second = runCommand("soffice", []);
    const cause = Object.assign(new Error("EACCES"), { code: "EACCES" });
    denied.emit("error", cause);
    await expect(second).rejects.toBe(cause);
  });

  it("kills the command and rejects when it runs past the timeout", async () => {
    const fake = child();
    const done = runCommand("soffice", [], { timeoutMs: 5000 });
    const assertion = expect(done).rejects.toMatchObject({
      name: "CommandFailedError",
      exitCode: null,
      stderr: "Command timed out",
    });

    await vi.advanceTimersByTimeAsync(5000);

    await assertion;
    expect(fake.kill).toHaveBeenCalledTimes(1);
  });

  it("settles once: a late close after a timeout changes nothing, and a finish clears the timer", async () => {
    const slow = child();
    const timedOut = runCommand("a", [], { timeoutMs: 1000 });
    const assertion =
      expect(timedOut).rejects.toBeInstanceOf(CommandFailedError);
    await vi.advanceTimersByTimeAsync(1000);
    slow.emit("close", 0);
    await assertion;

    const quick = child();
    const finished = runCommand("b", [], { timeoutMs: 1000 });
    quick.emit("close", 0);
    await expect(finished).resolves.toBeUndefined();
    await vi.advanceTimersByTimeAsync(2000);
    expect(quick.kill).not.toHaveBeenCalled();
  });

  it("copes with a child that has no stderr stream", async () => {
    const fake = child(false);
    const done = runCommand("x", []);

    fake.emit("close", 0);

    await expect(done).resolves.toBeUndefined();
  });
});
