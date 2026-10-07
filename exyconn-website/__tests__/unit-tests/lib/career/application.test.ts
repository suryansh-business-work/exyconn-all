/** The job application contract: the résumé a browser may post, and the words of its form. */
import { describe, expect, it } from "vitest";
import {
  JOB_APPLICATION_FORM_TYPE,
  RESUME_ACCEPT,
  RESUME_MAX_BYTES,
  readResume,
} from "../../../../src/lib/career/application";
import { APPLY_COPY } from "../../../../src/lib/career/copy";

const PDF = "data:application/pdf;base64,JVBERi0xLjc=";

describe("application contract", () => {
  it("files under the portal's job-application type, PDF or Word up to 5 MB", () => {
    expect(JOB_APPLICATION_FORM_TYPE).toBe("job-application");
    expect(RESUME_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(RESUME_ACCEPT.split(",")).toEqual([".pdf", ".doc", ".docx"]);
  });
});

describe("readResume", () => {
  it("accepts a named base64 data URL and trims the name", () => {
    expect(readResume({ name: "  cv.pdf ", data: PDF })).toEqual({ name: "cv.pdf", data: PDF });
  });

  it("accepts Word's long media type", () => {
    const docx =
      "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEs=";
    expect(readResume({ name: "cv.docx", data: docx })?.data).toBe(docx);
  });

  it("refuses anything that is not an object", () => {
    expect(readResume(null)).toBeNull();
    expect(readResume("cv.pdf")).toBeNull();
    expect(readResume(undefined)).toBeNull();
  });

  it("refuses a missing or blank name", () => {
    expect(readResume({ data: PDF })).toBeNull();
    expect(readResume({ name: "   ", data: PDF })).toBeNull();
    expect(readResume({ name: 7, data: PDF })).toBeNull();
  });

  it("refuses data that is not a base64 data URL", () => {
    expect(readResume({ name: "cv.pdf" })).toBeNull();
    expect(readResume({ name: "cv.pdf", data: 12 })).toBeNull();
    expect(readResume({ name: "cv.pdf", data: "https://example.com/cv.pdf" })).toBeNull();
    expect(readResume({ name: "cv.pdf", data: "data:application/pdf,plain" })).toBeNull();
    expect(
      readResume({ name: "cv.pdf", data: "data:application/pdf;base64,not base64!" })
    ).toBeNull();
  });

  it("refuses a file over the size cap", () => {
    const header = "data:application/pdf;base64,";
    const atCap = header + "A".repeat(Math.ceil(RESUME_MAX_BYTES / 3) * 4);
    const overCap = header + "A".repeat(Math.ceil(RESUME_MAX_BYTES / 3) * 4 + 200);
    expect(readResume({ name: "cv.pdf", data: atCap })?.name).toBe("cv.pdf");
    expect(readResume({ name: "cv.pdf", data: overCap })).toBeNull();
  });
});

describe("APPLY_COPY", () => {
  it("offers distinct values in every choice list", () => {
    for (const options of [
      APPLY_COPY.experienceOptions,
      APPLY_COPY.noticeOptions,
      APPLY_COPY.referralOptions,
    ]) {
      const values = options.map((option) => option.value);
      expect(new Set(values).size).toBe(values.length);
      expect(options.every((option) => option.label.trim() !== "")).toBe(true);
    }
  });

  it("names the company and role in the templated sentences", () => {
    expect(APPLY_COPY.coverLetter).toContain("{company}");
    expect(APPLY_COPY.successText).toContain("{title}");
    expect(APPLY_COPY.successAction).toContain("{company}");
  });
});
