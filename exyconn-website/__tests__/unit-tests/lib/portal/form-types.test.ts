import { beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

type FormTypes = typeof import("../../../../src/lib/portal/form-types");
let formTypes: FormTypes;

beforeEach(async () => {
  // The list is cached for the life of the process, so every test gets a fresh module.
  vi.resetModules();
  portalRequest.mockReset();
  formTypes = await import("../../../../src/lib/portal/form-types");
});

describe("website form types", () => {
  it("reads the accepted form identifiers from the portal", async () => {
    portalRequest.mockResolvedValue({ websiteFormTypes: ["contact", "career", "contact"] });

    const types = await formTypes.getWebsiteFormTypes();

    expect([...types]).toEqual(["contact", "career"]);
    expect(portalRequest).toHaveBeenCalledWith("query { websiteFormTypes }");
  });

  it("asks only once and then serves the cached list", async () => {
    portalRequest.mockResolvedValue({ websiteFormTypes: ["contact"] });

    const first = await formTypes.getWebsiteFormTypes();
    const second = await formTypes.getWebsiteFormTypes();

    expect(second).toBe(first);
    expect(portalRequest).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failure, so the next submission asks again", async () => {
    portalRequest.mockRejectedValueOnce(new Error("down"));
    portalRequest.mockResolvedValueOnce({ websiteFormTypes: ["grievance"] });

    await expect(formTypes.getWebsiteFormTypes()).rejects.toThrow("down");
    await expect(formTypes.getWebsiteFormTypes()).resolves.toEqual(new Set(["grievance"]));
  });
});
