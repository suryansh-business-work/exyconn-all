import ContentCopy from "@mui/icons-material/ContentCopy";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { duplicateScenario, LIMITS, type Estimate } from "@exyconn/gcc-cost";
import { ConfirmDialog, type ConfirmRequest } from "../../dialogs/ConfirmDialog";
import { NameDialog, type NameRequest } from "../../dialogs/NameDialog";
import { A } from "../../strings/assumptions";
import { UI } from "../../strings/ui";

/** Lean / Standard / Enterprise and any copies: pick, rename, duplicate, delete. */
export function ScenarioManager() {
  const { control, getValues, setValue } = useFormContext<Estimate>();
  const scenarios = useWatch({ control, name: "scenarios" });
  const activeId = useWatch({ control, name: "activeScenarioId" });
  const [naming, setNaming] = useState<NameRequest | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const update = (next: Estimate["scenarios"], active: string) => {
    setValue("scenarios", next, { shouldDirty: true });
    setValue("activeScenarioId", active, { shouldDirty: true });
  };

  const duplicate = (id: string, name: string) =>
    setNaming({
      title: UI.scenarios.duplicate,
      label: UI.scenarios.rename,
      initial: `${name}${UI.scenarios.copySuffix}`,
      submitLabel: UI.scenarios.duplicate,
      maxLength: 60,
      onSubmit: (value) => {
        const source = getValues("scenarios").find((scenario) => scenario.id === id);
        if (source) {
          const copy = duplicateScenario(source, value);
          update([...getValues("scenarios"), copy], copy.id);
        }
      },
    });

  const rename = (index: number, name: string) =>
    setNaming({
      title: UI.scenarios.rename,
      label: UI.scenarios.rename,
      initial: name,
      submitLabel: UI.estimates.rename,
      maxLength: 60,
      onSubmit: (value) => setValue(`scenarios.${index}.name`, value, { shouldDirty: true }),
    });

  const remove = (id: string, name: string) =>
    setConfirm({
      title: UI.scenarios.remove,
      message: UI.scenarios.confirmDelete(name),
      confirmLabel: UI.confirm.remove,
      destructive: true,
      onConfirm: () => {
        const rest = getValues("scenarios").filter((scenario) => scenario.id !== id);
        update(
          rest,
          id === getValues("activeScenarioId") ? rest[0].id : getValues("activeScenarioId")
        );
      },
    });

  const full = scenarios.length >= LIMITS.scenarios;
  return (
    <fieldset className="gcc-group">
      <legend className="gcc-group__title">{A.scenarios}</legend>
      <p className="gcc-lines__note">{full ? UI.scenarios.limit : A.scenariosNote}</p>
      <ul className="gcc-scenarios">
        {scenarios.map((scenario, index) => (
          <li key={scenario.id} className="gcc-scenarios__item">
            <Button
              variant={scenario.id === activeId ? "contained" : "outlined"}
              aria-pressed={scenario.id === activeId}
              onClick={() => setValue("activeScenarioId", scenario.id, { shouldDirty: true })}
            >
              {scenario.id === activeId
                ? `${A.editing}: ${scenario.name}`
                : `${A.edit}: ${scenario.name}`}
            </Button>
            <Tooltip title={UI.estimates.rename}>
              <IconButton
                aria-label={`${UI.estimates.rename}: ${scenario.name}`}
                onClick={() => rename(index, scenario.name)}
              >
                <EditOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title={UI.scenarios.duplicate}>
              <span>
                <IconButton
                  aria-label={`${UI.scenarios.duplicate}: ${scenario.name}`}
                  disabled={full}
                  onClick={() => duplicate(scenario.id, scenario.name)}
                >
                  <ContentCopy />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={UI.scenarios.remove}>
              <span>
                <IconButton
                  aria-label={`${UI.scenarios.remove}: ${scenario.name}`}
                  disabled={scenarios.length <= 1}
                  onClick={() => remove(scenario.id, scenario.name)}
                >
                  <DeleteOutlined />
                </IconButton>
              </span>
            </Tooltip>
          </li>
        ))}
      </ul>
      <NameDialog request={naming} onClose={() => setNaming(null)} />
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </fieldset>
  );
}
