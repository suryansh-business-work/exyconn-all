import { EventEmitter } from "node:events";
import fs from "node:fs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import { binaryParser } from "../../../__tests__/helpers/binaryParser";
import routes from "../routes";

const app = mountRouter(routes);
const PDF = Buffer.from("%PDF-1.7 body");

/** Makes `qpdf` end with `exit` (after `onSpawn` wrote its output), or fail to start with `error`. */
function qpdf(behavior: {
  exit?: number;
  error?: string;
  onSpawn?: (args: string[]) => void;
}) {
  mocks.spawn.mockImplementation((_command: string, args: string[]) => {
    const child = Object.assign(new EventEmitter(), {
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    process.nextTick(() => {
      if (behavior.error) {
        child.emit(
          "error",
          Object.assign(new Error("spawn"), { code: behavior.error }),
        );
        return;
      }
      behavior.onSpawn?.(args);
      child.emit("close", behavior.exit ?? 0);
    });
    return child;
  });
}

const attachPdf = (
  req: request.Test,
  filename = "a.pdf",
  contentType = "application/pdf",
) => req.attach("file", PDF, { filename, contentType });

beforeEach(() => {
  mocks.spawn.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /protect", () => {
  it("needs a PDF, and ignores a file that is neither a PDF type nor named .pdf", async () => {
    const none = await request(app)
      .post("/protect")
      .field("userPassword", "pw");
    const other = await attachPdf(
      request(app).post("/protect").field("userPassword", "pw"),
      "notes.txt",
      "text/plain",
    );

    expect(none.status).toBe(400);
    expect(none.body).toEqual({ error: "No PDF file provided" });
    expect(other.status).toBe(400);
  });

  it("accepts a file named .pdf even when its type is generic", async () => {
    qpdf({
      onSpawn: (args) => fs.writeFileSync(args.at(-1)!, "%PDF encrypted"),
    });

    const res = await attachPdf(
      request(app).post("/protect").field("userPassword", "pw"),
      "SCAN.PDF",
      "application/octet-stream",
    )
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="protected.pdf"',
    );
  });

  it("answers 500 when qpdf fails", async () => {
    qpdf({ exit: 2 });

    const res = await attachPdf(
      request(app).post("/protect").field("userPassword", "pw"),
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to protect PDF" });
  });
});

describe("POST /unlock", () => {
  it("needs a PDF and a password", async () => {
    const noFile = await request(app).post("/unlock").field("password", "pw");
    const noPassword = await attachPdf(request(app).post("/unlock"));

    expect(noFile.body).toEqual({ error: "No PDF file provided" });
    expect(noPassword.body).toEqual({ error: "password is required" });
  });

  it("returns the unlocked PDF", async () => {
    qpdf({ onSpawn: (args) => fs.writeFileSync(args.at(-1)!, "%PDF open") });

    const res = await attachPdf(
      request(app).post("/unlock").field("password", "pw"),
    )
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="unlocked.pdf"',
    );
  });

  it("answers 400 for a wrong password and 500 for any other failure", async () => {
    qpdf({ exit: 2 });
    const wrong = await attachPdf(
      request(app).post("/unlock").field("password", "pw"),
    );
    qpdf({ error: "EACCES" });
    const broken = await attachPdf(
      request(app).post("/unlock").field("password", "pw"),
    );

    expect(wrong.status).toBe(400);
    expect(wrong.body).toEqual({ error: "Incorrect password" });
    expect(broken.status).toBe(500);
    expect(broken.body).toEqual({ error: "Failed to unlock PDF" });
  });
});
