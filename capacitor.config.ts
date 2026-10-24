import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.messrskoraishtraders.app',
  appName: 'মেসার্স কোরাইশ ট্রেডার্স',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#020617',
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#064e3b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
