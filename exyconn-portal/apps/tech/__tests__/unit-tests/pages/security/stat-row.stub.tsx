import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

/** Stands in for the shell's StatRow: one labelled figure per tile, readable by test id. */
export function StatRowStub({ stats }: Readonly<{ stats: readonly StatItem[] }>) {
  return (
    <dl>
      {stats.map((stat) => (
        <div key={stat.label} data-testid={`stat-${stat.label}`}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The `@exyconn/shell/components/dashboard/StatRow` module with the stand-in in place. */
export function statRowModule() {
  return { StatRow: StatRowStub };
}
