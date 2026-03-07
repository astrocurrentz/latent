import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.latent.app",
  appName: "Latent",
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
