import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swello.app',
  appName: 'Swello',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'marisela-falsifiable-ridiculously.ngrok-free.dev',
      'swello-backend.onrender.com'
    ]
  }
};

export default config;
