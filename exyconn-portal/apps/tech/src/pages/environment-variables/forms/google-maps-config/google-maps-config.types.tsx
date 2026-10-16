import { z } from 'zod';
import type { GoogleMapsConfigsQuery } from '@exyconn/shell/graphql/generated';
import { secretField } from '../../secret';

export type GoogleMapsConfigRow = GoogleMapsConfigsQuery['googleMapsConfigs'][number];

/** Google API keys are 39 characters starting "AIza"; anything else is a paste error. */
const googleKey = {
  test: (value: string) => value.startsWith('AIza') && value.length >= 30,
  message: 'A Google API key starts with "AIza", e.g. AIzaSy…',
};

/**
 * Both keys are write-only: blank on an edit keeps the stored one. The server key is required to
 * create (search cannot run without it); the browser key is optional (maps are hidden without it).
 */
export const makeGoogleMapsConfigSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(100, 'At most 100 characters'),
    browserKey: z
      .string()
      .trim()
      .refine((value) => value === '' || googleKey.test(value), googleKey.message),
    serverKey: secretField(isEdit, 'Places server key is required', googleKey),
    isActive: z.enum(['true', 'false']),
  });

export type GoogleMapsConfigSchema = ReturnType<typeof makeGoogleMapsConfigSchema>;
export type GoogleMapsConfigValues = z.infer<GoogleMapsConfigSchema>;
