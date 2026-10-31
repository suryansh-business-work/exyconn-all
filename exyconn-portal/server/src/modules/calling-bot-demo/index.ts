/**
 * The AI calling bot demo at demos.exyconn.com/calling-bot-demo — the portal side of it: its
 * settings (Agents > Calling bot), and asking for a call. The audio itself runs on the
 * demo's own voice server (demos/calling-bot-demo/server), which trusts the tickets signed here.
 */
export { callingBotTypeDefs } from './calling-bot.typeDefs';
export { callingBotResolvers } from './calling-bot.resolvers';
export { backfillPhoneFields, migratePhoneProvider } from './calling-bot.migrations';
export { ensureCallingBotScenarios } from './calling-bot.scenarios.service';
