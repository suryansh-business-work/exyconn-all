// @vitest-environment jsdom
/** The quote's team: a row per role with head count and rate, added, changed and removed. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamFields } from "../../../../../src/components/company/quote/TeamFields";
import { ROLES, type TeamLine } from "../../../../../src/lib/company/quote";
import { renderWithUser } from "../../../test-utils";
import { quoteText } from "../company-fixtures";
import { QuoteHarness } from "./quote-harness";

const { scope } = quoteText;
const line = (roleId: string, rate: number, count = 1, customLabel = ""): TeamLine => ({
  roleId,
  count,
  rate,
  customLabel,
});

function renderTeam(team?: TeamLine[]) {
  return renderWithUser(
    <QuoteHarness values={team ? { team } : {}} fields={["team"]}>
      <TeamFields />
    </QuoteHarness>
  );
}

const roles = () => screen.getAllByLabelText<HTMLSelectElement>(scope.role).map((s) => s.value);
const rates = () => screen.getAllByLabelText<HTMLInputElement>(scope.rate).map((i) => i.value);
const removeButton = (role: string) =>
  screen.getByRole("button", { name: scope.removeRole.replace("{role}", role) });

describe("TeamFields", () => {
  it("starts with the default team, every role grouped and priced", () => {
    renderTeam();
    expect(screen.getByRole("group", { name: scope.team })).toBeInTheDocument();
    expect(roles()).toEqual(["fullstack", "qa"]);
    expect(rates()).toEqual(["50", "35"]);
    expect(screen.getAllByLabelText<HTMLInputElement>(scope.count).map((i) => i.value)).toEqual([
      "1",
      "1",
    ]);
    expect(screen.getAllByRole("option", { name: "Security Engineer ($65/hr)" })).toHaveLength(2);
    expect(removeButton("Full Stack Engineer")).toBeEnabled();
  });

  it("adds the next role not yet in the team, at its rate", async () => {
    const { user } = renderTeam();
    await user.click(screen.getByRole("button", { name: scope.addRole }));
    expect(roles()).toEqual(["fullstack", "qa", "pm"]);
    expect(rates()).toEqual(["50", "35", "50"]);
    expect(removeButton("Project Manager")).toBeInTheDocument();
  });

  it("removes a row, but never the last one", async () => {
    const { user } = renderTeam();
    await user.click(removeButton("QA Engineer"));
    expect(roles()).toEqual(["fullstack"]);
    expect(removeButton("Full Stack Engineer")).toBeDisabled();
  });

  it("stops offering more rows at the team limit", () => {
    renderTeam(ROLES.slice(0, 12).map((role) => line(role.id, role.rate)));
    expect(roles()).toHaveLength(12);
    expect(screen.queryByRole("button", { name: scope.addRole })).not.toBeInTheDocument();
  });

  it("takes the new role's rate when the role changes", async () => {
    const { user } = renderTeam();
    await user.selectOptions(screen.getAllByLabelText(scope.role)[1], "security");
    expect(rates()).toEqual(["50", "65"]);
    expect(removeButton("Security Engineer")).toBeInTheDocument();
    expect(screen.queryByLabelText(scope.customName)).not.toBeInTheDocument();
  });

  it("asks for a name for a custom role", async () => {
    const { user } = renderTeam();
    await user.selectOptions(screen.getAllByLabelText(scope.role)[0], "custom");
    const name = screen.getByLabelText(scope.customName);
    expect(name).toHaveAttribute("placeholder", scope.customNamePlaceholder);
    expect(rates()).toEqual(["50", "35"]);
    await user.type(name, "Blockchain Wizard");
    expect(name).toHaveValue("Blockchain Wizard");
  });

  it("explains a head count, rate or custom name it cannot accept", async () => {
    const { user } = renderTeam([line("qa", 10, 0), line("custom", 50, 1, "x".repeat(61))]);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("At least 1")).toBeInTheDocument();
    expect(screen.getByText("At least $20/hr")).toBeInTheDocument();
    expect(screen.getByText("Too long!")).toBeInTheDocument();
    expect(screen.getAllByLabelText(scope.count)[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByLabelText(scope.rate)[1]).toHaveAttribute("aria-invalid", "false");
  });

  it("explains an empty team", async () => {
    const { user } = renderTeam([]);
    expect(roles).toThrow();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Add at least one role")).toBeInTheDocument();
  });
});
