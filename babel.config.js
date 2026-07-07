module.exports = {
  presets: [
    ['module:@react-native/babel-preset'],
    ['nativewind/babel'],
  ],
  plugins: [
    '@babel/plugin-transform-class-static-block',
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: false,
    }],
    'react-native-reanimated/plugin',
  ],
};
