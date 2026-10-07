// @vitest-environment jsdom
/** Quote steps 1 and 2: the project type, then the duration and monthly hours. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceStep } from "../../../../../src/components/company/quote/ServiceStep";
import { ScopeStep } from "../../../../../src/components/company/quote/ScopeStep";
import { ChoiceCards } from "../../../../../src/components/company/quote/ChoiceCards";
import {
  DURATION_PRESETS,
  HOURS_OPTIONS,
  PROJECT_TYPES,
} from "../../../../../src/lib/company/quote";
import { renderWithUser } from "../../../test-utils";
import { quoteText } from "../company-fixtures";
import { QuoteHarness } from "./quote-harness";

const { service, scope } = quoteText;

describe("ServiceStep", () => {
  it("offers every project type as a radio card, MVP first and chosen", () => {
    renderWithUser(
      <QuoteHarness>
        <ServiceStep />
      </QuoteHarness>
    );
    expect(screen.getByRole("group", { name: service.legend })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(PROJECT_TYPES.length);
    expect(screen.getByRole("radio", { name: /MVP \/ Prototype/ })).toBeChecked();
    expect(screen.getByText("Quick proof of concept")).toBeInTheDocument();
    expect(screen.queryByLabelText(new RegExp(service.describe))).not.toBeInTheDocument();
  });

  it("asks for a description only when the project is 'Other'", async () => {
    const { user } = renderWithUser(
      <QuoteHarness>
        <ServiceStep />
      </QuoteHarness>
    );
    await user.click(screen.getByRole("radio", { name: /^Other/ }));
    const description = screen.getByLabelText(new RegExp(service.describe));
    expect(description).toHaveAttribute("placeholder", service.describePlaceholder);
    expect(description).toHaveAttribute("aria-invalid", "false");

    await user.click(screen.getByRole("radio", { name: /SaaS Application/ }));
    expect(screen.queryByLabelText(new RegExp(service.describe))).not.toBeInTheDocument();
  });

  it("refuses a description over 1000 characters", async () => {
    const { user } = renderWithUser(
      <QuoteHarness values={{ projectTypeId: "other", description: "x".repeat(1001) }}>
        <ServiceStep />
      </QuoteHarness>
    );
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Too long!")).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(service.describe))).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});

describe("ScopeStep", () => {
  it("offers the durations and the monthly hours", () => {
    renderWithUser(
      <QuoteHarness>
        <ScopeStep />
      </QuoteHarness>
    );
    const durations = screen.getByRole("group", { name: scope.duration });
    expect(durations.querySelectorAll('input[type="radio"]')).toHaveLength(DURATION_PRESETS.length);
    expect(screen.getByRole("radio", { name: /3 Months/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Full-time/ })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(
      DURATION_PRESETS.length + HOURS_OPTIONS.length
    );
    expect(screen.getByText(`160 ${scope.hoursUnit}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(scope.customMonths)).not.toBeInTheDocument();
  });

  it("asks for the months once 'Custom' is chosen", async () => {
    const { user } = renderWithUser(
      <QuoteHarness>
        <ScopeStep />
      </QuoteHarness>
    );
    await user.click(screen.getByRole("radio", { name: /^Custom/ }));
    const months = screen.getByLabelText(scope.customMonths);
    expect(months).toHaveAttribute("min", "0.25");
    expect(months).toHaveAttribute("max", "60");
    expect(months).toHaveValue(3);
  });

  it("refuses months outside the limits", async () => {
    const { user } = renderWithUser(
      <QuoteHarness values={{ durationId: "custom", customMonths: 61 }} fields={["customMonths"]}>
        <ScopeStep />
      </QuoteHarness>
    );
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("At most 60 months")).toBeInTheDocument();
    expect(screen.getByLabelText(scope.customMonths)).toHaveAttribute("aria-invalid", "true");
  });
});

describe("ChoiceCards", () => {
  it("draws a card without a second line when the option has none", () => {
    renderWithUser(
      <QuoteHarness>
        <ChoiceCards
          name="hoursId"
          legend="Hours"
          columns={4}
          options={[
            { id: "part", label: "Part-time" },
            { id: "full", label: "Full-time", detail: "Most teams" },
          ]}
        />
      </QuoteHarness>
    );
    const group = screen.getByRole("group", { name: "Hours" });
    expect(group.querySelector(".quote-choices--4")).not.toBeNull();
    expect(group.querySelectorAll(".quote-choice__detail")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: /^Full-time/ })).toBeChecked();
  });
});
