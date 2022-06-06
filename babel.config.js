module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    //! Added: musa | react-native-reanimated | 01/04/2022 - 5:43pm
    [
      'react-native-reanimated/plugin',
      // Leave out this block if not using barcode scanner
      {
        globals: ['__decode'],
      },
    ],
  ],
};
