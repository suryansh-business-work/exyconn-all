import { spawn } from "node:child_process";

// Thrown when the underlying binary is not installed on the host (spawn ENOENT)
export class ToolUnavailableError extends Error {
  constructor(command: string) {
    super(`Command not found: ${command}`);
    this.name = "ToolUnavailableError";
  }
}

// Thrown when the command runs but exits with a non-zero code (or times out)
export class CommandFailedError extends Error {
  constructor(
    command: string,
    public readonly exitCode: number | null,
    public readonly stderr: string,
  ) {
    super(`${command} exited with code ${exitCode}`);
    this.name = "CommandFailedError";
  }
}

export interface RunCommandOptions {
  timeoutMs?: number;
}

// Run a binary directly (no shell) so user input can never be interpreted by a shell
export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stderr = "";
    let timer: NodeJS.Timeout | undefined;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      fn();
    };

    if (options.timeoutMs) {
      timer = setTimeout(() => {
        child.kill();
        settle(() =>
          reject(new CommandFailedError(command, null, "Command timed out")),
        );
      }, options.timeoutMs);
    }

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        settle(() => reject(new ToolUnavailableError(command)));
      } else {
        settle(() => reject(error));
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        settle(resolve);
      } else {
        settle(() => reject(new CommandFailedError(command, code, stderr)));
      }
    });
  });
}
