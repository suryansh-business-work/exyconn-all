import Alert from "@mui/material/Alert";
import { useFormContext, useWatch } from "react-hook-form";
import { seatsNeeded, type Estimate } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput, TextInput } from "../fields";
import { useCalculator } from "../state/CalculatorContext";
import { F } from "../strings/fields";
import { OFFICE_MODEL_LABELS, optionsOf } from "../strings/options";
import { LinesEditor } from "./lines/LinesEditor";
import { OfficeExpansions } from "./OfficeExpansions";
import { Advanced, FieldGroup, SectionShell } from "./SectionShell";

const O = F.office;
const U = F.units;
const SEAT_PRICED = new Set(["coworking", "managed"]);

/** Step 2: city, workspace model, occupancy, deposits, running costs and expansion. */
export function OfficeSection() {
  const { scenarioIndex, preset } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const o = `scenarios.${scenarioIndex}.office` as const;
  const model = useWatch({ control, name: `${o}.model` });
  const utilisation = useWatch({ control, name: `${o}.utilisationPct` });
  const seats = useWatch({ control, name: `${o}.seats` });
  const target = useWatch({
    control,
    name: `scenarios.${scenarioIndex}.profile.targetHeadcountYear3`,
  });
  const cities = preset.cities.map((city) => ({ value: city, label: city }));
  const remote = model === "remote-first";
  const perSeat = SEAT_PRICED.has(model);
  const needed = seatsNeeded(target || 0, utilisation || 0);

  return (
    <SectionShell id="office">
      <FieldGroup title={O.location}>
        <SelectInput name={`${o}.city`} label={O.city} options={cities} />
        <TextInput name={`${o}.microLocation`} label={O.microLocation} hint={O.microHint} />
        <SelectInput name={`${o}.model`} label={O.model} options={optionsOf(OFFICE_MODEL_LABELS)} />
      </FieldGroup>
      {remote ? (
        <Alert severity="info">{O.remote}</Alert>
      ) : (
        <>
          <FieldGroup title={O.workspace}>
            <NumberInput
              name={`${o}.seats`}
              label={O.seats}
              hint={needed > seats ? O.seatsSuggestion(needed) : undefined}
            />
            <NumberInput
              name={`${o}.utilisationPct`}
              label={O.utilisation}
              tip={O.utilisationTip}
              unit={U.pct}
            />
            {perSeat ? (
              <NumberInput name={`${o}.seatPriceMonthly`} label={O.seatPrice} prefix="₹" />
            ) : (
              <>
                <NumberInput name={`${o}.areaPerSeatSqft`} label={O.areaPerSeat} unit={U.sqft} />
                <NumberInput name={`${o}.rentPerSqftMonthly`} label={O.rent} prefix="₹" />
                <NumberInput
                  name={`${o}.camPerSqftMonthly`}
                  label={O.cam}
                  tip={O.camTip}
                  prefix="₹"
                />
                <NumberInput name={`${o}.fitoutPerSqft`} label={O.fitout} prefix="₹" />
              </>
            )}
            <NumberInput
              name={`${o}.depositMonths`}
              label={O.deposit}
              tip={O.depositTip}
              unit={U.months}
            />
            <NumberInput name={`${o}.furnitureSetup`} label={O.furniture} prefix="₹" />
          </FieldGroup>
          <FieldGroup title={O.running}>
            <NumberInput name={`${o}.internetMonthly`} label={O.internet} prefix="₹" />
            <NumberInput name={`${o}.utilitiesMonthly`} label={O.utilities} prefix="₹" />
            <NumberInput
              name={`${o}.housekeepingSecurityMonthly`}
              label={O.housekeeping}
              prefix="₹"
            />
            <NumberInput
              name={`${o}.transportParkingInsuranceMonthly`}
              label={O.transport}
              prefix="₹"
            />
          </FieldGroup>
          <Advanced>
            <NumberInput name={`${o}.rentEscalationPct`} label={O.escalation} unit={U.pct} />
          </Advanced>
          <OfficeExpansions />
        </>
      )}
      <LinesEditor section="office" title={O.extraLines} />
    </SectionShell>
  );
}
