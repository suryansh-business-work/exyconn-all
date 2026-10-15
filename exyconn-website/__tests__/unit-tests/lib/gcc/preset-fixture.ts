/** The calculator preset exactly as the CMS seeds it, validated, for tests that need real inputs. */
import { cmsComponent } from "@exyconn/cms";
import { calculatorPresetSchema } from "@exyconn/gcc-cost";

export const DEFAULT_PRESET = calculatorPresetSchema.parse(
  cmsComponent("gcc.calculator")?.defaultProps.preset
);
