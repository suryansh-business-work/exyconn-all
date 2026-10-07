import { describe, expect, it } from "vitest";
import * as portal from "../../../../src/lib/portal";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import { getWebsiteFormTypes } from "../../../../src/lib/portal/form-types";
import { formatDate } from "../../../../src/lib/portal/helpers";
import { getNewsletterIssues, subscribeNewsletter } from "../../../../src/lib/portal/newsletter";
import { getBrandingSafe } from "../../../../src/lib/portal/queries";
import { sanitizeArticleHtml } from "../../../../src/lib/portal/sanitize";
import { getCaptcha, submitForm } from "../../../../src/lib/portal/submit";
import { requestDemoCode, verifyDemoCode } from "../../../../src/lib/portal/whatsappDemo";

describe("portal entry point", () => {
  it("re-exports each module's own functions, so callers share one implementation", () => {
    expect(portal.PortalRequestError).toBe(PortalRequestError);
    expect(portal.getWebsiteFormTypes).toBe(getWebsiteFormTypes);
    expect(portal.formatDate).toBe(formatDate);
    expect(portal.getNewsletterIssues).toBe(getNewsletterIssues);
    expect(portal.subscribeNewsletter).toBe(subscribeNewsletter);
    expect(portal.getBrandingSafe).toBe(getBrandingSafe);
    expect(portal.sanitizeArticleHtml).toBe(sanitizeArticleHtml);
    expect(portal.getCaptcha).toBe(getCaptcha);
    expect(portal.submitForm).toBe(submitForm);
    expect(portal.requestDemoCode).toBe(requestDemoCode);
    expect(portal.verifyDemoCode).toBe(verifyDemoCode);
  });
});
