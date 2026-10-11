import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type ArchivoLogo = { uri: string; nombre: string; tipo: string };

const LADO_MAXIMO = 512;

// Abre la galería (o el selector de archivos en web), recorta en cuadrado y comprime a 512px JPEG
// (la API acepta hasta 1 MB). Sirve para el logo, la foto de perfil y las fotos de productos.
export async function elegirLogo(): Promise<ArchivoLogo | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (resultado.canceled) return null;

  const { uri, width, height } = resultado.assets[0];
  // En web el lienzo necesita ambas medidas: con `height: null` falla ("source height is zero"),
  // así que el alto se calcula con la proporción de la imagen original
  const escala = width > 0 && height > 0 ? Math.min(1, LADO_MAXIMO / Math.max(width, height)) : 1;
  let contexto = ImageManipulator.manipulate(uri);
  if (escala < 1) contexto = contexto.resize({ width: Math.round(width * escala), height: Math.round(height * escala) });

  const imagen = await contexto.renderAsync();
  const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: guardada.uri, nombre: 'foto.jpg', tipo: 'image/jpeg' };
}

export async function aFormData(archivo: ArchivoLogo): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // En web el uri es un blob/data URL: se convierte a Blob real
    const blob = await (await fetch(archivo.uri)).blob();
    form.append('archivo', new Blob([blob], { type: archivo.tipo }), archivo.nombre);
  } else {
    // En iOS/Android React Native acepta el objeto { uri, name, type }
    form.append('archivo', { uri: archivo.uri, name: archivo.nombre, type: archivo.tipo } as unknown as Blob);
  }
  return form;
}
