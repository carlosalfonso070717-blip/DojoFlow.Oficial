import Constants from 'expo-constants';

// EXPO_PUBLIC_API_URL permite apuntar a una API local mientras se desarrolla
// (p. ej. EXPO_PUBLIC_API_URL=http://192.168.1.96:5199/api npx expo start)
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://dojoflow.club/api';

let token: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function setToken(nuevo: string | null) {
  token = nuevo;
}

export const obtenerToken = () => token;

// La sesión registra aquí qué hacer cuando la API responde 401
export function onSesionExpirada(callback: () => void) {
  alExpirarSesion = callback;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type Opciones = RequestInit & {
  // Para usar otro token que el de la sesión (p. ej. el del kiosco)
  tokenPropio?: string | null;
};

// Equivalente a obtenerHeaders() + fetch del frontend web
export async function api<T>(ruta: string, { tokenPropio, ...opciones }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opciones.headers as Record<string, string>),
  };
  // Con FormData (subir logo) el propio fetch pone el Content-Type con su boundary
  if (!(opciones.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const tokenUsado = tokenPropio === undefined ? token : tokenPropio;
  if (tokenUsado) headers.Authorization = `Bearer ${tokenUsado}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch {
    throw new ApiError('No se pudo contactar al servidor de GestAcademy.', 0);
  }

  // Solo un 401 con el token de la sesión significa que la sesión expiró
  if (res.status === 401 && tokenPropio === undefined && token) {
    alExpirarSesion?.();
    throw new ApiError('Sesión expirada', 401);
  }

  const texto = await res.text();
  const data = texto ? JSON.parse(texto) : null;

  if (!res.ok) {
    throw new ApiError(data?.error ?? data?.mensaje ?? `Error ${res.status}`, res.status);
  }
  return data as T;
}
