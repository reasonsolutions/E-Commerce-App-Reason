// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
// const { withNativeWind } = require('nativewind/metro');
// const path = require('path');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('@react-native/metro-config').MetroConfig}
//  */

// // Reanimated v4 and worklets expose TypeScript source via the `react-native`
// // field, which Metro can't transform reliably through the css-interop resolver
// // wrapper. Force resolution to the pre-compiled CommonJS output instead.
// const FORCE_COMPILED = new Set(['react-native-reanimated', 'react-native-worklets']);

// const config = {
//   resolver: {
//     resolveRequest: (context, moduleName, platform) => {
//       if (FORCE_COMPILED.has(moduleName)) {
//         const pkgJson = require(`${moduleName}/package.json`);
//         const compiledEntry = pkgJson.main || pkgJson.module;
//         return {
//           filePath: require.resolve(path.join(moduleName, compiledEntry)),
//           type: 'sourceFile',
//         };
//       }
//       return context.resolveRequest(context, moduleName, platform);
//     },
//   },
// };

// module.exports = withNativeWind(mergeConfig(getDefaultConfig(__dirname), config), {
//   input: './global.css',
// });


const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const config = {};

module.exports = withNativeWind(mergeConfig(getDefaultConfig(__dirname), config), {
  input: './global.css',
});