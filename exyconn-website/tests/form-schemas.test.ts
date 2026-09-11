import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { careerFormSchema, resumeError } from "../src/components/forms/career/career.schema";
import { contactFormSchema } from "../src/components/forms/contact/contact.schema";
import { grievanceFormSchema } from "../src/components/forms/grievance/grievance.schema";
import { indiaOfferFormSchema } from "../src/components/forms/india-offer/india-offer.schema";
import { legalFormSchema } from "../src/components/forms/legal/legal.schema";

/** The first message per field, the way the form shows it. */
const errorsOf = (schema: z.ZodType, values: Record<string, string>) => {
  const result = schema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message;
  }
  return errors;
};

const CAPTCHA = { captcha: "7" };

describe("contact form schema", () => {
  const valid = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    company: "",
    subject: "general",
    message: "Tell us about the project",
    ...CAPTCHA,
  };

  it("accepts a complete form and leaves the company optional", () => {
    expect(errorsOf(contactFormSchema, valid)).toEqual({});
  });

  it("names every required field when the form is blank", () => {
    const blank = Object.fromEntries(Object.keys(valid).map((key) => [key, ""]));
    expect(errorsOf(contactFormSchema, blank)).toEqual({
      firstName: "First name is required",
      lastName: "Last name is required",
      email: "Email is required",
      subject: "Please select a subject",
      message: "Message is required",
      captcha: "Please solve the captcha",
    });
  });

  it("checks lengths and the email pattern", () => {
    expect(
      errorsOf(contactFormSchema, { ...valid, firstName: "J", email: "john@", message: "short" })
    ).toEqual({
      firstName: "Too short!",
      email: "Invalid email address",
      message: "Message is too short!",
    });
  });
});

describe("career form schema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    jobId: "EXY-2024-001",
    message: "",
    ...CAPTCHA,
  };

  it("accepts a blank phone and a real one, trimmed", () => {
    expect(errorsOf(careerFormSchema, valid)).toEqual({});
    const parsed = careerFormSchema.parse({ ...valid, phone: " +1 (555) 000-0000 " });
    expect(parsed.phone).toBe("+1 (555) 000-0000");
  });

  it("rejects a phone that is not one", () => {
    expect(errorsOf(careerFormSchema, { ...valid, phone: "call me" })).toEqual({
      phone: "Invalid phone number",
    });
  });

  it("refuses a resume that is too large or not a document", () => {
    const pdf = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    const image = new File(["png"], "cv.png", { type: "image/png" });
    expect(resumeError(pdf)).toBe("");
    expect(resumeError(image)).toBe("Only PDF, DOC, and DOCX files are allowed");
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cv.pdf", {
      type: "application/pdf",
    });
    expect(resumeError(huge)).toBe("File size must be less than 5MB");
  });
});

describe("grievance form schema", () => {
  it("asks for detail before a grievance goes through", () => {
    expect(
      errorsOf(grievanceFormSchema, {
        name: "Jane",
        email: "jane@example.com",
        subject: "Late",
        message: "Too brief",
        ...CAPTCHA,
      })
    ).toEqual({
      subject: "Subject is too short!",
      message: "Please provide more details about your grievance",
    });
  });
});

describe("legal form schema", () => {
  const valid = {
    name: "Jane",
    email: "jane@example.com",
    legalType: "copyright",
    url: "",
    details: "The image on this page is mine and was used without permission.",
    ...CAPTCHA,
  };

  it("leaves the URL optional but checks it once given", () => {
    expect(errorsOf(legalFormSchema, valid)).toEqual({});
    expect(errorsOf(legalFormSchema, { ...valid, url: "https://example.com/a" })).toEqual({});
    expect(errorsOf(legalFormSchema, { ...valid, url: "example.com" })).toEqual({
      url: "Please enter a valid URL",
    });
  });

  it("requires a request type", () => {
    expect(errorsOf(legalFormSchema, { ...valid, legalType: "" })).toEqual({
      legalType: "Please select a type of legal request",
    });
  });
});

describe("India offer form schema", () => {
  const valid = {
    name: "Ravi Kumar",
    phone: "9876543210",
    email: "ravi@example.com",
    business: "",
    plan: "smart",
    message: "",
    ...CAPTCHA,
  };

  it("accepts a complete form and leaves business and message optional", () => {
    expect(errorsOf(indiaOfferFormSchema, valid)).toEqual({});
  });

  it("names every required field in Hindi when the form is blank", () => {
    const blank = Object.fromEntries(Object.keys(valid).map((key) => [key, ""]));
    expect(errorsOf(indiaOfferFormSchema, blank)).toEqual({
      name: "नाम ज़रूरी है",
      phone: "फ़ोन नंबर ज़रूरी है",
      email: "ईमेल ज़रूरी है",
      plan: "कोई प्लान चुनें",
      captcha: "कैप्चा हल करें",
    });
  });

  it("wants a ten-digit Indian mobile starting 6-9", () => {
    for (const phone of ["5876543210", "987654321", "+919876543210", "98765 43210"]) {
      expect(errorsOf(indiaOfferFormSchema, { ...valid, phone })).toEqual({
        phone: "सही 10 अंकों का मोबाइल नंबर डालें",
      });
    }
  });

  it("checks the name length, email pattern and the optional fields' limits", () => {
    expect(
      errorsOf(indiaOfferFormSchema, {
        ...valid,
        name: "R",
        email: "ravi@",
        business: "b".repeat(101),
        message: "m".repeat(501),
      })
    ).toEqual({
      name: "नाम बहुत छोटा है",
      email: "सही ईमेल डालें",
      business: "बहुत लंबा है",
      message: "संदेश बहुत लंबा है",
    });
  });
});
