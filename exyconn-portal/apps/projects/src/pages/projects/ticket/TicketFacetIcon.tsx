import { useT } from '@exyconn/i18n';
import { Tooltip } from '@exyconn/shell/components/ui';
import type { TicketFacet } from './ticket-meta';

interface TicketFacetIconProps {
  facet: TicketFacet;
  /** Prefix for the tooltip, e.g. "Type" or "Priority". */
  kind: string;
  size?: number;
}

/** The single glyph that stands for a ticket's type or priority, wherever it is shown. */
export function TicketFacetIcon({ facet, kind, size = 16 }: Readonly<TicketFacetIconProps>) {
  const t = useT();
  const Icon = facet.icon;
  return (
    <Tooltip title={t('{kind}: {facet}', { kind: t(kind), facet: t(facet.label) })}>
      <Icon sx={{ fontSize: size, color: facet.color }} />
    </Tooltip>
  );
}
