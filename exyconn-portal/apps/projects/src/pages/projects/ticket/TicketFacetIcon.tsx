import { useT } from '@exyconn/i18n';
import { Tooltip } from '@exyconn/shell/components/ui';
import type { TicketFacet } from './ticket-meta';

interface TicketFacetIconProps {
  facet: TicketFacet;
  /** Prefix for the tooltip, e.g. "Type" or "Priority". */
  kind: string;
  size?: number;
  /** The facet's name is already written next to the glyph (or in the control around it). */
  decorative?: boolean;
}

/** The single glyph that stands for a ticket's type or priority, wherever it is shown. */
export function TicketFacetIcon({
  facet,
  kind,
  size = 16,
  decorative = false,
}: Readonly<TicketFacetIconProps>) {
  const t = useT();
  const Icon = facet.icon;
  if (decorative) {
    return <Icon aria-hidden sx={{ fontSize: size, color: facet.color }} />;
  }
  const label = t('{kind}: {facet}', { kind: t(kind), facet: t(facet.label) });
  return (
    <Tooltip title={label}>
      <Icon
        tabIndex={0}
        role="img"
        aria-hidden={false}
        aria-label={label}
        sx={{ fontSize: size, color: facet.color }}
      />
    </Tooltip>
  );
}
