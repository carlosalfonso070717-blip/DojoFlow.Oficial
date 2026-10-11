import Constants from 'expo-constants';

export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'https://dojoflow.club/api';

let token: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function setToken(nuevo: string | null) {
  token = nuevo;
}

// La sesión registra aquí qué hacer cuando la API responde 401
export function onSesionExpirada(callback: () => void) {
  alExpirarSesion = callback;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Equivalente a obtenerHeaders() + fetch del frontend web
export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opciones.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch {
    throw new ApiError('No se pudo contactar al servidor de DojoFlow.', 0);
  }

  if (res.status === 401 && token) {
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
