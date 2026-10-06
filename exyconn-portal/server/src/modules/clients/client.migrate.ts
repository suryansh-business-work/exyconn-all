import { ClientModel } from './clients.model';

/**
 * Clients filed before the portal was multi-country carry only a GSTIN. Each becomes an Indian
 * client with that GSTIN as its tax number. Runs once per company (see lib/migrations).
 */
export async function migrateClientTaxIds(): Promise<void> {
  await ClientModel.updateMany({ gstin: { $nin: ['', null] }, taxId: { $in: ['', null] } }, [
    {
      $set: {
        taxIdType: 'IN_GST',
        taxId: '$gstin',
        // A field the row never had is missing, not null: $ifNull treats both as empty.
        country: { $cond: [{ $eq: [{ $ifNull: ['$country', ''] }, ''] }, 'IN', '$country'] },
      },
    },
  ]);
}
