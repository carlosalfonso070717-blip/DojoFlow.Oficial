import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { API_URL, obtenerToken } from '@/api/client';

export type FormatoReporte = 'pdf' | 'excel';

const TIPOS: Record<FormatoReporte, { mime: string; extension: string; uti: string }> = {
  pdf: { mime: 'application/pdf', extension: 'pdf', uti: 'com.adobe.pdf' },
  excel: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', uti: 'org.openxmlformats.spreadsheetml.sheet' },
};

// Descarga el reporte del mes y abre el menú del sistema para guardarlo o compartirlo
export async function descargarReporte(mesAnio: string, formato: FormatoReporte, nombreBase: string) {
  const tipo = TIPOS[formato];
  const respuesta = await fetch(`${API_URL}/Finanzas/${encodeURIComponent(mesAnio)}/reporte?formato=${formato}`, {
    headers: { Authorization: `Bearer ${obtenerToken() ?? ''}` },
  });

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);
    throw new Error(error?.error ?? 'No se pudo generar el reporte.');
  }

  const nombre = `${nombreBase.replace(/[\\/:*?"<>|]/g, '')}.${tipo.extension}`;

  if (Platform.OS === 'web') {
    // En el navegador: descarga directa del archivo
    const url = URL.createObjectURL(await respuesta.blob());
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
    return;
  }

  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.write(new Uint8Array(await respuesta.arrayBuffer()));

  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
  await Sharing.shareAsync(archivo.uri, { mimeType: tipo.mime, UTI: tipo.uti, dialogTitle: nombre });
}
