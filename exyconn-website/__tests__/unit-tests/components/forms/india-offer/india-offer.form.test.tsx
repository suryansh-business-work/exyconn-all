// @vitest-environment jsdom
/** The India offer lead form: plans, validation, the Hindi captcha and the send step. */
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type IndiaOfferFormCopy,
  IndiaOfferForm,
} from "../../../../../src/components/forms/india-offer";
import { type OfferPlan, planOptionLabel } from "../../../../../src/lib/india/plans";
import { renderWithUser } from "../../../test-utils";
import { postedTo, reply, serveSite } from "../forms.helpers";

const BASIC: OfferPlan = {
  id: "basic",
  tier: "Starter",
  name: "Basic",
  price: 4999,
  period: "once",
  cta: "Choose",
};
const SMART: OfferPlan = {
  ...BASIC,
  id: "smart",
  tier: "Growth",
  name: "Smart Biz",
  price: 9999,
  popular: true,
};
const PLANS = [BASIC, SMART];

const COPY: IndiaOfferFormCopy = {
  fields: {
    name: { label: "नाम", placeholder: "आपका नाम" },
    phone: { label: "मोबाइल", placeholder: "98765 43210" },
    email: { label: "ईमेल", placeholder: "you@example.com" },
    business: { label: "व्यवसाय", placeholder: "दुकान का नाम" },
    message: { label: "संदेश", placeholder: "कुछ और?" },
  },
  plan: { label: "पैकेज", placeholder: "पैकेज चुनें" },
  customPlan: "सलाह चाहिए",
  popularShort: "लोकप्रिय",
  captcha: {
    label: "सुरक्षा जांच",
    placeholder: "उत्तर",
    refreshTitle: "नया प्रश्न",
    refreshLabel: "नया सुरक्षा प्रश्न दिखाएं",
  },
  success: "धन्यवाद! हम जल्द संपर्क करेंगे।",
  submit: "भेजें",
  sending: "भेज रहे हैं…",
  status: {
    loading: "लोड हो रहा है…",
    loadFailed: "लोड नहीं हुआ",
    incorrect: "गलत उत्तर",
    failed: "भेजा नहीं गया",
  },
  messages: {
    nameRequired: "नाम ज़रूरी है",
    nameTooShort: "नाम छोटा है",
    nameTooLong: "नाम लंबा है",
    phoneRequired: "फ़ोन ज़रूरी है",
    phoneInvalid: "सही मोबाइल नंबर डालें",
    emailRequired: "ईमेल ज़रूरी है",
    emailInvalid: "सही ईमेल डालें",
    businessTooLong: "व्यवसाय का नाम लंबा है",
    planRequired: "पैकेज चुनें ज़रूरी है",
    messageTooLong: "संदेश लंबा है",
    captchaRequired: "प्रश्न हल करें",
  },
};

/** The control whose label starts with `label` (a required one ends in " *"). */
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));
const { fields, messages } = COPY;
const submit = () => screen.getByRole("button", { name: COPY.submit });

async function setup(post = () => reply(200)) {
  const fetchMock = serveSite(post);
  const view = renderWithUser(<IndiaOfferForm plans={PLANS} copy={COPY} />);
  await screen.findByText("1 + 1 = ?");
  return { ...view, fetchMock };
}

async function fillValid(user: UserEvent) {
  await user.type(field(fields.name.label), "Sunita");
  await user.type(field(fields.phone.label), "9876543210");
  await user.type(field(fields.email.label), "sunita@example.com");
  await user.type(field(fields.business.label), "Sunita Stores");
  await user.selectOptions(field(COPY.plan.label), "smart");
  await user.type(field(COPY.captcha.label), "2");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("IndiaOfferForm", () => {
  it("lists the plans, the popular one tagged, then the custom choice", async () => {
    await setup();
    const labels = screen.getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual([
      COPY.plan.placeholder,
      planOptionLabel(BASIC, COPY.popularShort),
      planOptionLabel(SMART, COPY.popularShort),
      COPY.customPlan,
    ]);
    expect(labels[2]).toContain(`(${COPY.popularShort})`);
    expect(field(fields.phone.label)).toHaveAttribute("maxlength", "10");
  });

  it("shows every required message and sends nothing when submitted empty", async () => {
    const { user, fetchMock } = await setup();
    await user.click(submit());
    for (const message of [
      messages.nameRequired,
      messages.phoneRequired,
      messages.emailRequired,
      messages.planRequired,
      messages.captchaRequired,
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(field(COPY.captcha.label)).toHaveAttribute("aria-invalid", "true");
    expect(postedTo(fetchMock)).toEqual([]);
  });

  it("checks the mobile number, the email and the name's length", async () => {
    const { user } = await setup();
    await user.type(field(fields.name.label), "S");
    await user.type(field(fields.phone.label), "5876543210");
    await user.type(field(fields.email.label), "sunita@");
    await user.click(submit());
    expect(await screen.findByText(messages.nameTooShort)).toBeInTheDocument();
    expect(screen.getByText(messages.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByText(messages.emailInvalid)).toBeInTheDocument();
  });

  it("sends the lead without the answer and clears the form", async () => {
    const { user, fetchMock } = await setup();
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.success);
    expect(postedTo(fetchMock)).toEqual([
      {
        formType: "india-offer",
        name: "Sunita",
        phone: "9876543210",
        email: "sunita@example.com",
        business: "Sunita Stores",
        plan: "smart",
        message: "",
        captchaToken: "token-1",
        captchaAnswer: "2",
      },
    ]);
    await waitFor(() => expect(field(fields.name.label)).toHaveValue(""));
  });

  it("asks for a new answer when the sum was wrong, and refreshes on request", async () => {
    const { user } = await setup(() => reply(400, { error: "captcha" }));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(COPY.status.incorrect);
    expect(field(COPY.captcha.label)).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByRole("button", { name: COPY.captcha.refreshLabel }));
    expect(screen.queryByText(COPY.status.incorrect)).not.toBeInTheDocument();
    expect(await screen.findByText("3 + 1 = ?")).toBeInTheDocument();
  });

  it("shows the failure banner when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = await setup(() => reply(500));
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(COPY.status.failed);
  });
});
