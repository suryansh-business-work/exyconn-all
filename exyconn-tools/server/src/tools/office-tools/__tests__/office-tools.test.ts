import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

// soffice writes <basename>.pdf into the --outdir directory
function writeConvertedPdf(args: string[]) {
  const outDir = args[4];
  const inputPath = args[5];
  const baseName = path.basename(inputPath, path.extname(inputPath));
  fs.writeFileSync(path.join(outDir, `${baseName}.pdf`), "%PDF-1.7 converted");
}

const docxInput = Buffer.from("fake docx bytes");
const originalSofficePath = process.env.SOFFICE_PATH;

beforeEach(() => {
  spawnMock.mockReset();
  delete process.env.SOFFICE_PATH;
});

afterEach(() => {
  if (originalSofficePath === undefined) {
    delete process.env.SOFFICE_PATH;
  } else {
    process.env.SOFFICE_PATH = originalSofficePath;
  }
});

describe("POST /api/tools/office-tools/office-to-pdf", () => {
  it("converts an office document via soffice and returns the PDF", async () => {
    mockSpawn({ exitCode: 0, onSpawn: writeConvertedPdf });

    const res = await request(app)
      .post("/api/tools/office-tools/office-to-pdf")
      .attach("file", docxInput, { filename: "report.docx" })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(Buffer.from(res.body).toString()).toContain("converted");

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [command, args] = spawnMock.mock.calls[0] as unknown as [
      string,
      string[],
    ];
    expect(command).toBe("soffice");
    expect(args.slice(0, 4)).toEqual([
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
    ]);
    expect(args).toHaveLength(6);
    expect(args[5].endsWith(".docx")).toBe(true);
  });

  it("uses SOFFICE_PATH when set", async () => {
    process.env.SOFFICE_PATH = "/opt/libreoffice/program/soffice";
    mockSpawn({ exitCode: 0, onSpawn: writeConvertedPdf });

    const res = await request(app)
      .post("/api/tools/office-tools/office-to-pdf")
      .attach("file", docxInput, { filename: "sheet.xlsx" })
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    const [command] = spawnMock.mock.calls[0] as unknown as [string, string[]];
    expect(command).toBe("/opt/libreoffice/program/soffice");
  });

  it("returns 503 when soffice is not installed", async () => {
    mockSpawn({ errorCode: "ENOENT" });

    const res = await request(app)
      .post("/api/tools/office-tools/office-to-pdf")
      .attach("file", docxInput, { filename: "report.docx" });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: "Office conversion service unavailable on this server",
    });
  });

  it("returns 500 when the conversion fails", async () => {
    mockSpawn({ exitCode: 1 });

    const res = await request(app)
      .post("/api/tools/office-tools/office-to-pdf")
      .attach("file", docxInput, { filename: "report.docx" });

    expect(res.status).toBe(500);
  });

  it("rejects unsupported file types", async () => {
    const res = await request(app)
      .post("/api/tools/office-tools/office-to-pdf")
      .attach("file", Buffer.from("plain text"), { filename: "notes.txt" });

    expect(res.status).toBe(400);
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
