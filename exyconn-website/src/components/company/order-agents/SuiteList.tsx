import type { OrderAgentsText } from "./order-agents.types";

interface SuiteListProps {
  names: readonly { id: string; name: string }[];
  total: number;
  error?: string;
  onRemove: (id: string) => void;
  text: OrderAgentsText;
}

/** The suite so far: the chosen agents, each removable, and how many of the catalogue. */
export function SuiteList({ names, total, error, onRemove, text }: Readonly<SuiteListProps>) {
  const count = text.count
    .replace("{count}", String(names.length))
    .replace("{total}", String(total));
  return (
    <div>
      <h2 id="agents-suite" className="inner-h3">
        {text.suite}
      </h2>
      <p className="stage-label mt-1" aria-live="polite">
        {count}
      </p>
      {names.length === 0 ? (
        <p className="inner-card__text mt-4">{text.empty}</p>
      ) : (
        <ul className="inner-chips mt-4">
          {names.map((agent) => (
            <li key={agent.id}>
              <button
                type="button"
                className="inner-chip"
                aria-label={`${text.remove}: ${agent.name}`}
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
