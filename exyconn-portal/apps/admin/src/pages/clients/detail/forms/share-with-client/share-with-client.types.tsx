import { z } from 'zod';
import { ClientSharedKind, type ClientSharedItemsQuery } from '@exyconn/shell/graphql/generated';

export type ClientSharedItemRow = ClientSharedItemsQuery['clientSharedItems'][number];

export const shareWithClientSchema = z.object({
  kind: z.enum(ClientSharedKind),
  refId: z.string().min(1, 'Pick what to share'),
  note: z.string().trim().max(1000, 'Keep the note under 1000 characters'),
  notify: z.boolean(),
});

export type ShareWithClientFormValues = z.infer<typeof shareWithClientSchema>;

export const shareWithClientDefaults: ShareWithClientFormValues = {
  kind: ClientSharedKind.Contract,
  refId: '',
  note: '',
  notify: true,
};
