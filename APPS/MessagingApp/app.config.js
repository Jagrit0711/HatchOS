export default ({ config }) => ({
  ...config,
  name: "HatchOS Messaging",
  slug: "hatchos-messaging",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  androidStatusBar: {
    backgroundColor: "#075E54",
    barStyle: "light-content",
    translucent: false
  },
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#075E54"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.hatchos.messaging"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.hatchos.messaging",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "RECORD_AUDIO"
    ],
    statusBar: {
      backgroundColor: "#075E54",
      barStyle: "light-content",
      translucent: false
    }
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    // PWA settings - THIS MAKES IT A REAL APP!
    name: "HatchOS Messaging",
    shortName: "Messaging",
    description: "Real-time messaging application",
    lang: "en",
    scope: "/",
    startUrl: "/",
    display: "standalone", // KEY: Makes it open as standalone app, not browser!
    orientation: "portrait",
    themeColor: "#075E54",
    backgroundColor: "#075E54",
    crossorigin: "use-credentials"
  },
  plugins: []
});
