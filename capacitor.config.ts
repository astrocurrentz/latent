import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.latent.app",
  appName: "Lantent 27",
  webDir: "out",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  },
  server: {
    androidScheme: "https"
  }
};

export default config;
