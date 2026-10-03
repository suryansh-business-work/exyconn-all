import type { Agent } from "../../../lib/company/agents";
import { agentsText } from "../../../lib/company/agents";

interface AgentPickerProps {
  agents: readonly Agent[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}

/** The catalogue: each agent with a toggle that adds it to (or takes it out of) the suite. */
export function AgentPicker({ agents, selected, onToggle }: Readonly<AgentPickerProps>) {
  return (
    <section aria-labelledby="agents-available">
      <h2 id="agents-available" className="stage-label inner-index">
        {agentsText.available}
      </h2>
      <ul className="agents-list">
        {agents.map((agent, index) => {
          const added = selected.includes(agent.id);
          return (
            <li
              key={agent.id}
              className={`inner-card${added ? " agents-card--added" : ""}`}
              data-stage-highlight={index + 1}
            >
              <h3 className="inner-h3">{agent.name}</h3>
              <p className="inner-card__text">{agent.description}</p>
              <div className="agents-card__foot">
                {added && <span className="stage-label inner-index">{agentsText.added}</span>}
                <button
                  type="button"
                  className={`inner-action ${added ? "inner-action--ghost" : "inner-action--primary"}`}
                  onClick={() => onToggle(agent.id)}
                >
                  {added ? agentsText.remove : agentsText.add}
                  <span className="sr-only">: {agent.name}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
