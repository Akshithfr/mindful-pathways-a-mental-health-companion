// craco.config.js
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new NodePolyfillPlugin()
      ]
    },
    configure: {
      resolve: {
        fallback: {
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          os: require.resolve('os-browserify/browser'),
          path: require.resolve('path-browserify'),
          fs: false,
          zlib: require.resolve('browserify-zlib'),
          assert: require.resolve('assert/'),
          process: require.resolve('process/browser'),
        },
      },
    }
  }
};