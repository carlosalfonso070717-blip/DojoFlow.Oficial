import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// En el celular los tokens van cifrados en SecureStore; en web (que no lo soporta) van en localStorage
const esWeb = Platform.OS === 'web';

export const almacen = {
  async leer(llave: string): Promise<string | null> {
    if (esWeb) return globalThis.localStorage?.getItem(llave) ?? null;
    return SecureStore.getItemAsync(llave);
  },
  async guardar(llave: string, valor: string): Promise<void> {
    if (esWeb) globalThis.localStorage?.setItem(llave, valor);
    else await SecureStore.setItemAsync(llave, valor);
  },
  async borrar(llave: string): Promise<void> {
    if (esWeb) globalThis.localStorage?.removeItem(llave);
    else await SecureStore.deleteItemAsync(llave);
  },
};
