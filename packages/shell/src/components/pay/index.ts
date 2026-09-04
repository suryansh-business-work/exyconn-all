/**
 * How an employee is paid, as one definition.
 *
 * Two screens edit the same salary structure — the HR employee record and HR > Salaries —
 * and a pay type that only one of them could set would be a field the other silently reset.
 */
export { CompensationFields } from './CompensationFields';
export {
  DEFAULT_CURRENCY,
  compensationSchema,
  rateLabel,
  toCompensationValues,
  toSalaryInput,
  usesSingleAmount,
  type CompensationValues,
  type EmployeeSalary,
} from './compensation';
