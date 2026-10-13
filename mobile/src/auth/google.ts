import Constants from 'expo-constants';

// Client IDs de Google Cloud (OAuth). El "web" se usa en el navegador y también en Android/iOS
// para que el ID token salga a nombre de la API. Sin él, el botón de Google no se muestra.
const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

export const GOOGLE_WEB_CLIENT_ID: string | undefined =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra?.googleWebClientId || undefined;

// Lo que entrega "Continuar con Google": ID token en la app nativa, access token en la web
export type CredencialGoogle = { idToken: string } | { accessToken: string };

export const GOOGLE_IOS_CLIENT_ID: string | undefined =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra?.googleIosClientId || undefined;
