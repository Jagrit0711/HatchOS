const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfill to the beginning of the bundle
config.serializer = {
  ...config.serializer,
  getPolyfills: () => [path.resolve(__dirname, 'polyfill.js')],
};

module.exports = config;
