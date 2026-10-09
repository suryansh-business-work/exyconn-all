/** babel-preset-expo wires Expo Router, Reanimated's worklets plugin and the React compiler defaults. */
module.exports = function babelConfig(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
