/**
 * /order-agents: what a suite request sends. The agents on offer and every word of the page
 * are the CMS component's props ('agents.order').
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
}

/** The agents chosen, by name, in catalogue order — what the request says was picked. */
export const selectedAgentNames = (ids: readonly string[], agents: readonly Agent[]): string[] =>
  agents.filter((agent) => ids.includes(agent.id)).map((agent) => agent.name);

export interface AgentRequestContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  notes: string;
}

/**
 * What /api/form-submit receives for a suite request: the contact form's fields, so the
 * portal files it like any enquiry, with the chosen agents in the message.
 */
export const agentRequest = (
  contact: AgentRequestContact,
  names: readonly string[]
): Record<string, string> => {
  const picked = `Requested agents: ${names.join(", ")}`;
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    company: contact.company,
    subject: "project",
    page: "order-agents",
    agents: names.join(", "),
    message: contact.notes.trim() ? `${picked}\n\n${contact.notes.trim()}` : picked,
  };
};
