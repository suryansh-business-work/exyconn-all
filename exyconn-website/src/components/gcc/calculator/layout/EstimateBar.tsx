import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { createEstimate, type Estimate } from "@exyconn/gcc-cost";
import { ConfirmDialog, type ConfirmRequest } from "../dialogs/ConfirmDialog";
import { NameDialog, type NameRequest } from "../dialogs/NameDialog";
import { useCalculator } from "../state/CalculatorContext";
import { UI } from "../strings/ui";
import { EstimateMenu } from "./EstimateMenu";
import { SaveStatus } from "./SaveStatus";

/** Which estimate is open, what can be done to it, which scenario is edited, and the save state. */
export function EstimateBar() {
  const { store, preset, live } = useCalculator();
  const { control, setValue, getValues } = useFormContext<Estimate>();
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [naming, setNaming] = useState<NameRequest | null>(null);
  const activeScenarioId = useWatch({ control, name: "activeScenarioId" });
  const scenarios = useWatch({ control, name: "scenarios" });
  const name = useWatch({ control, name: "name" });
  const offered = preset.scenarios.find((scenario) => scenario.id === store.presetOffer);

  const actions = {
    create: () =>
      setNaming({
        title: UI.estimates.create,
        label: UI.estimates.nameLabel,
        initial: UI.store.defaultName,
        submitLabel: UI.estimates.create,
        onSubmit: (value) => store.create(value),
      }),
    rename: () =>
      setNaming({
        title: UI.estimates.rename,
        label: UI.estimates.nameLabel,
        initial: name,
        submitLabel: UI.estimates.rename,
        onSubmit: (value) => setValue("name", value, { shouldDirty: true }),
      }),
    duplicate: () =>
      setNaming({
        title: UI.estimates.duplicate,
        label: UI.estimates.nameLabel,
        initial: `${name}${UI.estimates.copySuffix}`,
        submitLabel: UI.estimates.duplicate,
        onSubmit: (value) => {
          const source = live.estimate ?? store.active;
          if (source) {
            store.duplicate(source, value);
          }
        },
      }),
    remove: () =>
      setConfirm({
        title: UI.estimates.remove,
        message: UI.estimates.confirmDelete(name),
        confirmLabel: UI.confirm.remove,
        destructive: true,
        onConfirm: () => store.remove(getValues("id")),
      }),
    reset: () =>
      setConfirm({
        title: UI.estimates.reset,
        message: UI.estimates.confirmReset,
        confirmLabel: UI.confirm.reset,
        destructive: true,
        onConfirm: () => {
          const current = live.estimate ?? getValues();
          store.replaceActive(
            current,
            createEstimate(preset, current.name, new Date().toISOString())
          );
        },
      }),
  };

  return (
    <section className="gcc-bar" aria-label={UI.estimates.label}>
      <div className="gcc-bar__row">
        <TextField
          select
          label={UI.estimates.label}
          value={getValues("id")}
          onChange={(event) => store.open(event.target.value)}
          className="gcc-bar__estimate"
        >
          {store.entries.map((entry) => (
            <MenuItem key={entry.id} value={entry.id}>
              {entry.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={UI.scenarios.label}
          value={activeScenarioId}
          onChange={(event) =>
            setValue("activeScenarioId", event.target.value, { shouldDirty: true })
          }
          className="gcc-bar__scenario"
        >
          {scenarios.map((scenario) => (
            <MenuItem key={scenario.id} value={scenario.id}>
              {scenario.name}
            </MenuItem>
          ))}
        </TextField>
        <EstimateMenu actions={actions} />
        <SaveStatus />
      </div>
      <p className="gcc-bar__note">{UI.store.localOnly}</p>
      {store.notice && (
        <Alert severity="warning" onClose={store.dismissNotice}>
          {store.notice}
        </Alert>
      )}
      {offered && (
        <Alert
          severity="info"
          action={
            <>
              <Button
                size="small"
                onClick={() => {
                  store.dismissPresetOffer();
                  store.create(`${offered.name} estimate`, offered.id);
                }}
              >
                {UI.estimates.presetAction}
              </Button>
              <Button size="small" onClick={store.dismissPresetOffer}>
                {UI.common.close}
              </Button>
            </>
          }
        >
          {UI.estimates.presetOffer(offered.name)}
        </Alert>
      )}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
      <NameDialog request={naming} onClose={() => setNaming(null)} />
    </section>
  );
}
