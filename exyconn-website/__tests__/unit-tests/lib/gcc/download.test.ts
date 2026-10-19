// @vitest-environment jsdom
/** Downloads: safe file names from estimate names, and a blob handed to the browser once. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fileStem, saveBlob, saveText } from "../../../../src/lib/gcc/download";

describe("fileStem", () => {
  it.each([
    ["Pune GCC — FY27 (draft)", "pune-gcc-fy27-draft"],
    ["  Café Zürich  ", "cafe-zurich"],
    ["x".repeat(80), "x".repeat(60)],
    ["—— ??? ——", "gcc-estimate"],
    ["", "gcc-estimate"],
  ])("turns %j into %j", (name, stem) => {
    expect(fileStem(name)).toBe(stem);
  });
});

describe("saveBlob", () => {
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    vi.useFakeTimers();
    clicked = [];
    globalThis.URL.createObjectURL = vi.fn(() => "blob:estimate");
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicked.push(this);
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("clicks a temporary link to the blob, then frees the blob a second later", () => {
    const blob = new Blob(["{}"], { type: "application/json" });
    saveBlob(blob, "pune.json");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked).toHaveLength(1);
    expect(clicked[0]).toMatchObject({ download: "pune.json", rel: "noopener" });
    expect(clicked[0].getAttribute("href")).toBe("blob:estimate");
    expect(document.querySelector("a")).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:estimate");
  });

  it("saves text as a blob of the given type", async () => {
    saveText("a,b", "rows.csv", "text/csv");
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv");
    expect(await blob.text()).toBe("a,b");
    expect(clicked[0].download).toBe("rows.csv");
  });
});
