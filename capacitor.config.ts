// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.company.appname', // Your app ID
  appName: 'NeuroX',           // Your app name
  webDir: 'out',             // <--- ENSURE THIS IS 'out'
  bundledWebRuntime: false,
  // If you had server configurations before, they might need to be reconsidered
  // as Capacitor apps primarily load local web assets.
  // server: {
  //   androidScheme: 'https'
  // }
};

export default config;