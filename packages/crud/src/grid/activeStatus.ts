/**
 * Website records carry an `isActive` boolean rather than a status enum. Mapping it to
 * the portal's status vocabulary lets the shared status chip colour-code it like every
 * other module's lifecycle column.
 */
export const activeStatus = (row: { isActive: boolean }): string =>
  row.isActive ? 'ACTIVE' : 'INACTIVE';
