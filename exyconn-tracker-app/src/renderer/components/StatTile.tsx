interface Props {
  label: string;
  value: string;
}

/** A single labelled stat in the dashboard grid. */
export default function StatTile({ label, value }: Readonly<Props>): JSX.Element {
  return (
    <div className="tile">
      <span className="tile__value">{value}</span>
      <span className="tile__label">{label}</span>
    </div>
  );
}
