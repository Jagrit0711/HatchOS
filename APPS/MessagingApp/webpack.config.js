const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      pwa: true,
      offline: true,
    },
    argv
  );

  // Add service worker support
  if (env.mode === 'production') {
    config.plugins.push(
      new InjectManifest({
        swSrc: './public/service-worker.js',
        swDest: 'service-worker.js',
      })
    );
  }

  return config;
};
