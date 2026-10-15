import type { Translate } from '../../propertyText';
import type { ColumnChoice } from '../buildColumns';

/** A column's name as a person reads it: built-in names translated, custom ones as typed. */
export function choiceLabel(t: Translate, choice: ColumnChoice): string {
  return choice.translate ? t(choice.label) : choice.label;
}
