import { EventEmitter } from "node:events";
import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("@imgly/background-removal-node", () => ({
  removeBackground: vi.fn(),
}));

import { spawn } from "node:child_process";
import { createApp } from "../../../app";
import { binaryParser } from "../../../__tests__/helpers/binaryParser";

const app = createApp();
const spawnMock = vi.mocked(spawn);

type FakeChild = EventEmitter & { stderr: EventEmitter; kill: () => void };

interface SpawnBehavior {
  exitCode?: number;
  errorCode?: string;
  onSpawn?: (args: string[]) => void;
}

function mockSpawn(behavior: SpawnBehavior) {
  spawnMock.mockImplementation(((_command: string, args: string[]) => {
    const child = new EventEmitter() as FakeChild;
    child.stderr = new EventEmitter();
    child.kill = () => undefined;
    process.nextTick(() => {
      if (behavior.errorCode) {
        const error: NodeJS.ErrnoException = new Error("spawn error");
        error.code = behavior.errorCode;
        child.emit("error", error);
        return;
      }
      behavior.onSpawn?.(args);
      child.emit("close", behavior.exitCode ?? 0);
    });
    return child;
  }) as unknown as typeof spawn);
}

const pdfInput = Buffer.from("%PDF-1.4 original");

beforeEach(() => {
  spawnMock.mockReset();
});

describe("POST /api/tools/pdf-tools/protect", () => {
  it("encrypts the PDF via qpdf and streams it back", async () => {
    mockSpawn({
      exitCode: 0,
      onSpawn: (args) => {
        fs.writeFileSync(args[args.length - 1], "%PDF-1.7 encrypted");
      },
    });

    const res = await request(app)
      .post("/api/tools/pdf-tools/protect")
      .field("userPassword", "user-pass")
      .field("ownerPassword", "owner-pass")
      .attach("file", pdfInput, {
        filename: "doc.pdf",
        contentType: "application/pdf",
      })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(Buffer.from(res.body).toString()).toContain("encrypted");

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [command, args] = spawnMock.mock.calls[0] as unknown as [
      string,
      string[],
    ];
    expect(command).toBe("qpdf");
    expect(args.slice(0, 5)).toEqual([
      "--encrypt",
      "user-pass",
      "owner-pass",
      "256",
      "--",
    ]);
    expect(args).toHaveLength(7);
    expect(args[5]).toMatch(/\.pdf$/);
    expect(args[6]).toMatch(/\.pdf$/);
  });

  it("defaults the owner password to the user password", async () => {
    mockSpawn({
      exitCode: 0,
      onSpawn: (args) => {
        fs.writeFileSync(args[args.length - 1], "%PDF-1.7 encrypted");
      },
    });

    const res = await request(app)
      .post("/api/tools/pdf-tools/protect")
      .field("userPassword", "only-pass")
      .attach("file", pdfInput, {
        filename: "doc.pdf",
        contentType: "application/pdf",
      })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    const [, args] = spawnMock.mock.calls[0] as unknown as [string, string[]];
    expect(args[1]).toBe("only-pass");
    expect(args[2]).toBe("only-pass");
  });

  it("returns 400 when userPassword is missing", async () => {
    const res = await request(app)
      .post("/api/tools/pdf-tools/protect")
      .attach("file", pdfInput, {
        filename: "doc.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("returns 503 when qpdf is not installed", async () => {
    mockSpawn({ errorCode: "ENOENT" });

    const res = await request(app)
      .post("/api/tools/pdf-tools/protect")
      .field("userPassword", "user-pass")
      .attach("file", pdfInput, {
        filename: "doc.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: "PDF encryption service unavailable on this server",
    });
  });
});

describe("POST /api/tools/pdf-tools/unlock", () => {
  it("decrypts the PDF via qpdf with the given password", async () => {
    mockSpawn({
      exitCode: 0,
      onSpawn: (args) => {
        fs.writeFileSync(args[args.length - 1], "%PDF-1.7 decrypted");
      },
    });

    const res = await request(app)
      .post("/api/tools/pdf-tools/unlock")
      .field("password", "secret")
      .attach("file", pdfInput, {
        filename: "locked.pdf",
        contentType: "application/pdf",
      })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(Buffer.from(res.body).toString()).toContain("decrypted");

    const [command, args] = spawnMock.mock.calls[0] as unknown as [
      string,
      string[],
    ];
    expect(command).toBe("qpdf");
    expect(args[0]).toBe("--password=secret");
    expect(args[1]).toBe("--decrypt");
    expect(args).toHaveLength(4);
  });

  it("returns 400 for a wrong password (non-zero qpdf exit)", async () => {
    mockSpawn({ exitCode: 2 });

    const res = await request(app)
      .post("/api/tools/pdf-tools/unlock")
      .field("password", "wrong")
      .attach("file", pdfInput, {
        filename: "locked.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Incorrect password" });
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/tools/pdf-tools/unlock")
      .attach("file", pdfInput, {
        filename: "locked.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("returns 503 when qpdf is not installed", async () => {
    mockSpawn({ errorCode: "ENOENT" });

    const res = await request(app)
      .post("/api/tools/pdf-tools/unlock")
      .field("password", "secret")
      .attach("file", pdfInput, {
        filename: "locked.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: "PDF encryption service unavailable on this server",
    });
  });
});
