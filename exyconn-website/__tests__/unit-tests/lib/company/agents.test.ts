/** /order-agents: the names of the chosen agents and the request it sends. */
import { describe, expect, it } from "vitest";
import { agentRequest, selectedAgentNames, type Agent } from "../../../../src/lib/company/agents";

const AGENTS: Agent[] = [
  { id: "sales", name: "Sales Agent", description: "" },
  { id: "hr", name: "HR Agent", description: "" },
  { id: "ops", name: "Ops Agent", description: "" },
];

const contact = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "Engines",
  notes: "",
};

describe("selectedAgentNames", () => {
  it("names the chosen agents in catalogue order, ignoring unknown ids", () => {
    expect(selectedAgentNames(["ops", "sales", "ghost"], AGENTS)).toEqual([
      "Sales Agent",
      "Ops Agent",
    ]);
  });

  it("names nobody when nothing is chosen", () => {
    expect(selectedAgentNames([], AGENTS)).toEqual([]);
  });
});

describe("agentRequest", () => {
  it("sends the contact fields as a project enquiry from the page", () => {
    expect(agentRequest(contact, ["Sales Agent", "HR Agent"])).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      company: "Engines",
      subject: "project",
      page: "order-agents",
      agents: "Sales Agent, HR Agent",
      message: "Requested agents: Sales Agent, HR Agent",
    });
  });

  it("adds trimmed notes after the agents and ignores blank ones", () => {
    expect(agentRequest({ ...contact, notes: "  Start in May \n" }, ["Ops Agent"]).message).toBe(
      "Requested agents: Ops Agent\n\nStart in May"
    );
    expect(agentRequest({ ...contact, notes: "   " }, ["Ops Agent"]).message).toBe(
      "Requested agents: Ops Agent"
    );
  });
});
