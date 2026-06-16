import type { CapacitorConfig } from '@capacitor/cli';

/** Brand pink (matches PWA manifest theme_color). */
const BRAND_PINK = '#f472b6';

const config: CapacitorConfig = {
  appId: 'com.beautyreviewty.app',
  appName: 'BeautyReviewty',
  webDir: 'public',
  server: {
    url: 'https://beautyreviewty.com',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#fff5f7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: BRAND_PINK,
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
