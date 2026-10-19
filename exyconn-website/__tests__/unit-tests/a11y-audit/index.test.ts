/** The CLI entry hands its arguments to the audit and exits with the code the audit returns. */
import { afterEach, expect, it, vi } from "vitest";

const audit = vi.hoisted(() => ({ main: vi.fn() }));
vi.mock("../../../scripts/a11y-audit/audit.mjs", () => audit);

const argv = process.argv;
afterEach(() => {
  process.argv = argv;
  process.exitCode = undefined;
  vi.resetModules();
});

it.each([0, 1])("passes the flags after the script name and exits with %i", async (code) => {
  audit.main.mockResolvedValueOnce(code);
  process.argv = ["node", "index.mjs", "--base", "http://site"];
  await import("../../../scripts/a11y-audit/index.mjs");
  expect(audit.main).toHaveBeenLastCalledWith(["--base", "http://site"]);
  expect(process.exitCode).toBe(code);
});
