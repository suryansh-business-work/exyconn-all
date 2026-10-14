/**
 * The chats screen, at the root of the app (demos.exyconn.com/whatsapp-demo); `/<demo key>`
 * opens one chat.
 */
export const HOME_PATH = '/';

/** The address of one demo's chat. */
export const chatPath = (demoKey: string): string => `/${demoKey}`;
