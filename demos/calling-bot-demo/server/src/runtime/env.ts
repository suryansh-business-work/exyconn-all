/** The voice server's settings. Credentials are not here: they live in the active config. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export const env = Object.freeze({
  port: Number.parseInt(process.env.PORT ?? '4042', 10),
  mongoUri: required('MONGODB_URI'),
  /**
   * Where Vobiz reaches this server from the internet (behind nginx), for the stream address
   * in the answer XML and for checking Vobiz's callback signatures.
   */
  publicUrl: (process.env.PUBLIC_URL ?? 'https://demos.exyconn.com/calling-bot-demo/api').replace(
    /\/$/,
    '',
  ),
});
