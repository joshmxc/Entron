import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.entron.app",
  appName: "Entron",
  webDir: "www",
  server: {
    // Your live Vercel URL — the app loads this in the native shell
    url: "https://entron-production.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0a1628",
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: "#0a1628",
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0a1628",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a1628",
    },
  },
};

export default config;
