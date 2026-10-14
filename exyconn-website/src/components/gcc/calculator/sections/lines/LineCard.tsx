import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ContentCopy from "@mui/icons-material/ContentCopy";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useFormContext, useWatch } from "react-hook-form";
import type { Category, CostLine, Estimate } from "@exyconn/gcc-cost";
import { useCalculator, useMoney } from "../../state/CalculatorContext";
import { L } from "../../strings/lines";
import { UI } from "../../strings/ui";
import { LineFields } from "./LineFields";

type Contribution = keyof typeof L.contributes;

function contributionOf(line: CostLine): Contribution {
  if (
    line.frequency === "one-time" &&
    line.pricing !== "per-hire" &&
    line.pricing !== "percentage"
  ) {
    return "setup";
  }
  return line.setupFee > 0 ? "both" : "recurring";
}

interface LineCardProps {
  index: number;
  categories: readonly Category[];
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/** One cost line: a summary row with its forecast amount, expanding to every parameter. */
export function LineCard({
  index,
  categories,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Readonly<LineCardProps>) {
  const { scenarioIndex, live } = useCalculator();
  const money = useMoney();
  const { control } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.lines.${index}` as const;
  const line = useWatch({ control, name });
  const total = live.sourceTotals[scenarioIndex]?.get(line.id) ?? 0;
  const category = categories.find((item) => item.id === line.categoryId)?.label ?? "";
  const excluded = !line.enabled || line.applicability === "not-applicable";
  const summaryId = `gcc-line-${line.id}`;

  return (
    <Accordion
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      className={excluded ? "gcc-line gcc-line--off" : "gcc-line"}
    >
      <AccordionSummary expandIcon={<ExpandMore />} id={summaryId} aria-label={L.edit(line.label)}>
        <span className="gcc-line__summary">
          <span className="gcc-line__label">{line.label}</span>
          <span className="gcc-line__meta">
            {category && <Chip size="small" label={category} />}
            <Chip size="small" variant="outlined" label={L.contributes[contributionOf(line)]} />
            {line.applicability === "review" && (
              <Chip size="small" color="warning" label="Review" />
            )}
            {line.optional && <Chip size="small" variant="outlined" label={UI.common.optional} />}
          </span>
          <span className="gcc-line__amount">
            {excluded ? L.disabled : L.inForecast(money.format(total))}
          </span>
        </span>
      </AccordionSummary>
      <AccordionDetails>
        <LineFields name={name} line={line} categories={categories} />
        <div className="gcc-line__tools">
          <Tooltip title={UI.common.moveUp}>
            <span>
              <IconButton
                aria-label={`${UI.common.moveUp}: ${line.label}`}
                disabled={!onMoveUp}
                onClick={onMoveUp}
              >
                <ArrowUpward />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={UI.common.moveDown}>
            <span>
              <IconButton
                aria-label={`${UI.common.moveDown}: ${line.label}`}
                disabled={!onMoveDown}
                onClick={onMoveDown}
              >
                <ArrowDownward />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={UI.common.duplicate}>
            <IconButton aria-label={`${UI.common.duplicate}: ${line.label}`} onClick={onDuplicate}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title={UI.common.remove}>
            <IconButton aria-label={`${UI.common.remove}: ${line.label}`} onClick={onRemove}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
