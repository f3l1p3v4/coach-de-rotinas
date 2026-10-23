/* eslint-env jest, node */
// jsdom does not provide Web Crypto in all supported Node/Jest combinations.
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', { configurable: true, value: require('crypto').webcrypto });
}
