module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "expo-router": "./shims/expo-router.js",
          "@expo/vector-icons": "./shims/vector-icons.js",
          "expo-image": "./shims/expo-image.js",
          "expo-image-picker": "./shims/expo-image-picker.js",
          "expo-document-picker": "./shims/expo-document-picker.js",
          "expo-linear-gradient": "react-native-linear-gradient",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
