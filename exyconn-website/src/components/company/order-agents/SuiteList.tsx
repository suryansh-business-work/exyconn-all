import { agentsText } from "../../../lib/company/agents";

interface SuiteListProps {
  names: readonly { id: string; name: string }[];
  total: number;
  error?: string;
  onRemove: (id: string) => void;
}

/** The suite so far: the chosen agents, each removable, and how many of the catalogue. */
export function SuiteList({ names, total, error, onRemove }: Readonly<SuiteListProps>) {
  const count = agentsText.count
    .replace("{count}", String(names.length))
    .replace("{total}", String(total));
  return (
    <div>
      <h2 id="agents-suite" className="inner-h3">
        {agentsText.suite}
      </h2>
      <p className="stage-label mt-1" aria-live="polite">
        {count}
      </p>
      {names.length === 0 ? (
        <p className="inner-card__text mt-4">{agentsText.empty}</p>
      ) : (
        <ul className="inner-chips mt-4">
          {names.map((agent) => (
            <li key={agent.id}>
              <button
                type="button"
                className="inner-chip"
                aria-label={`${agentsText.remove}: ${agent.name}`}
                onClick={() => onRemove(agent.id)}
              >
                {agent.name} <i className="fa-solid fa-xmark ml-2" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="legal-form__fine-print agents-error">
          {error}
        </p>
      )}
    </div>
  );
}
