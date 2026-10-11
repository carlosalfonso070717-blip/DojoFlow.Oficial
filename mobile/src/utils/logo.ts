import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type ArchivoLogo = { uri: string; nombre: string; tipo: string };

// Abre la galería, recorta en cuadrado y comprime a 512px JPEG (la API acepta hasta 1 MB)
export async function elegirLogo(): Promise<ArchivoLogo | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (resultado.canceled) return null;

  const imagen = await ImageManipulator.manipulate(resultado.assets[0].uri).resize({ width: 512, height: null }).renderAsync();
  const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: guardada.uri, nombre: 'logo.jpg', tipo: 'image/jpeg' };
}

export async function aFormData(archivo: ArchivoLogo): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // En web el uri es un blob/data URL: se convierte a Blob real
    const blob = await (await fetch(archivo.uri)).blob();
    form.append('archivo', blob, archivo.nombre);
  } else {
    // En iOS/Android React Native acepta el objeto { uri, name, type }
    form.append('archivo', { uri: archivo.uri, name: archivo.nombre, type: archivo.tipo } as unknown as Blob);
  }
  return form;
}
