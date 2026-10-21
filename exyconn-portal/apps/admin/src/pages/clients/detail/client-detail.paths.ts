/** Where Admin › Clients lives; a client's own page is `${CLIENTS_PATH}/:id/:tab`. */
export const CLIENTS_PATH = '/clients';

/** The page for one client; Tabber opens its first tab. */
export const clientPath = (id: string) => `${CLIENTS_PATH}/${id}`;
