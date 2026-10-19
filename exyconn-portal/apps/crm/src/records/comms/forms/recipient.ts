import { z } from 'zod';
import { E164_PHONE } from '@exyconn/regex';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { dialable } from '../recordChannels';

/** A record number the dock may dial or text: it must be in international format. */
export const recipientField = z
  .string()
  .trim()
  .min(1, 'Choose the number')
  .regex(
    E164_PHONE,
    'This number is not in international format. Save it on the record as e.g. +14155550100 first.',
  );

/** The record's numbers as choices; the value is the number as the provider dials it. */
export const recipientOptions = (phones: readonly string[]): SelectOption[] =>
  phones.map((phone) => ({ value: dialable(phone), label: phone }));
