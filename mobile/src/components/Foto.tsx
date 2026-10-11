import { Image } from 'expo-image';
import { ImagePlus, Package } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '@/theme';
import { alerta } from '@/utils/alerta';
import { elegirLogo, type ArchivoLogo } from '@/utils/logo';
import { Boton } from './Boton';
import { urlAbsoluta } from './Elementos';
import { Texto } from './Texto';

// Foto de un producto, o un recuadro con su ícono si no tiene
export function FotoProducto({ url, tamano, style }: { url?: string | null; tamano?: number; style?: StyleProp<ViewStyle> }) {
  const { color, radio } = useTema();
  const caja = [{ width: tamano, height: tamano, borderRadius: tamano ? Math.round(tamano * 0.27) : radio.l, backgroundColor: color.fondo }, style];
  if (url) {
    return (
      <View style={[caja, { overflow: 'hidden' }]}>
        <Image source={{ uri: urlAbsoluta(url) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[caja, estilos.vacia]}>
      <Package size={tamano ? Math.round(tamano * 0.42) : 36} color={color.textoTenue} strokeWidth={1.5} />
    </View>
  );
}

type PropsSelector = {
  // Foto guardada en la API
  actual?: string | null;
  // Foto recién elegida (aún sin subir)
  nueva: ArchivoLogo | null;
  // La persona pidió quitar la foto guardada
  quitada: boolean;
  onElegir: (archivo: ArchivoLogo) => void;
  onQuitar: () => void;
};

// Campo de formulario para la foto de un producto: vista previa, elegir y quitar
export function SelectorFoto({ actual, nueva, quitada, onElegir, onQuitar }: PropsSelector) {
  const [abriendo, setAbriendo] = useState(false);
  const visible = nueva?.uri ?? (quitada ? null : actual);

  async function elegir() {
    setAbriendo(true);
    try {
      const archivo = await elegirLogo();
      if (archivo) onElegir(archivo);
    } catch (e) {
      alerta('No se pudo abrir la foto', (e as Error).message);
    } finally {
      setAbriendo(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Texto variante="detalle" tono="suave">
        Foto
      </Texto>
      <View style={estilos.selector}>
        <FotoProducto url={visible} tamano={84} />
        <View style={{ flex: 1, gap: 8 }}>
          <Boton titulo={visible ? 'Cambiar foto' : 'Elegir foto'} icono={ImagePlus} variante="tonal" tamano="compacto" cargando={abriendo} onPress={elegir} />
          {visible && <Boton titulo="Quitar foto" variante="fantasma" tamano="compacto" onPress={onQuitar} />}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  vacia: { alignItems: 'center', justifyContent: 'center' },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
