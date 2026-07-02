import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the built web app (dist/) in native iOS/Android shells for
 * the App Store / Play Store. Native projects are generated with
 * `npm run cap:add:ios` / `cap:add:android` and built in Xcode / Android
 * Studio. `appId` must match the bundle identifier registered in App Store
 * Connect — change it there and here together.
 */
const config: CapacitorConfig = {
  appId: "com.aquilla.app",
  appName: "Aquilla",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    backgroundColor: "#F7F8FA",
  },
  android: {
    backgroundColor: "#F7F8FA",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0E1726",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F7F8FA",
    },
  },
};

export default config;
