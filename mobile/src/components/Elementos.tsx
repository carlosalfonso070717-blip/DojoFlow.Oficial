import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { API_URL } from '@/api/client';
import { useTema } from '@/theme';
import { Boton } from './Boton';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

export type TonoInsignia = 'marca' | 'exito' | 'aviso' | 'peligro' | 'neutro';

// Insignia tonal: fondo suave y texto fuerte del mismo color
export function Insignia({ texto, tono = 'neutro', icono: Icono }: { texto: string; tono?: TonoInsignia; icono?: LucideIcon }) {
  const { color, radio } = useTema();
  const paleta: Record<TonoInsignia, [string, string]> = {
    marca: [color.marcaSuave, color.marcaTexto],
    exito: [color.exitoSuave, color.exito],
    aviso: [color.avisoSuave, color.aviso],
    peligro: [color.peligroSuave, color.peligro],
    neutro: [color.fondo, color.textoSuave],
  };
  const [fondo, frente] = paleta[tono];

  return (
    <View style={[estilos.insignia, { backgroundColor: fondo, borderRadius: radio.total }]}>
      {Icono && <Icono size={13} color={frente} strokeWidth={2.4} />}
      <Texto variante="pequeno" style={{ color: frente, fontFamily: 'Figtree_600SemiBold' }}>
        {texto}
      </Texto>
    </View>
  );
}

export function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  const { color, radio } = useTema();
  return (
    <Presionable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activo }}
      style={[
        estilos.chip,
        {
          borderRadius: radio.total,
          backgroundColor: activo ? color.marca : color.superficie,
          borderColor: activo ? color.marca : color.bordeFuerte,
        },
      ]}
    >
      <Texto variante="detalle" style={{ color: activo ? color.sobreMarca : color.texto, fontFamily: 'Figtree_600SemiBold' }}>
        {texto}
      </Texto>
    </Presionable>
  );
}

// Iniciales del nombre, o el logo si se pasa una URL
export function Avatar({ nombre, logoUrl, tamano = 44 }: { nombre: string; logoUrl?: string | null; tamano?: number }) {
  const { color } = useTema();
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (logoUrl) {
    return (
      <Image
        source={{ uri: urlAbsoluta(logoUrl) }}
        style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: color.superficie }}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`Logo de ${nombre}`}
      />
    );
  }
  return (
    <View
      style={{
        width: tamano,
        height: tamano,
        borderRadius: tamano / 2,
        backgroundColor: color.marcaSuave,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Texto variante="subtitulo" tono="marca" style={{ fontSize: tamano * 0.38, lineHeight: tamano * 0.5 }}>
        {iniciales}
      </Texto>
    </View>
  );
}

// La API devuelve el logo como ruta relativa (/api/Academia/{id}/logo?v=2)
// (las imágenes locales recién elegidas —file:, blob:, data:— se usan tal cual)
export function urlAbsoluta(ruta: string) {
  if (!ruta.startsWith('/')) return ruta;
  return API_URL.replace(/\/api\/?$/, '') + ruta;
}

type EstadoVacioProps = {
  icono: LucideIcon;
  titulo: string;
  mensaje?: string;
  accion?: { titulo: string; onPress: () => void };
  tono?: 'normal' | 'error';
};

// Pantallas vacías o con error: dicen qué pasa y qué hacer
export function EstadoVacio({ icono: Icono, titulo, mensaje, accion, tono = 'normal' }: EstadoVacioProps) {
  const { color } = useTema();
  const esError = tono === 'error';
  return (
    <View style={estilos.vacio}>
      <View style={[estilos.iconoVacio, { backgroundColor: esError ? color.peligroSuave : color.marcaSuave }]}>
        <Icono size={28} color={esError ? color.peligro : color.marcaTexto} />
      </View>
      <Texto variante="subtitulo" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      {mensaje && (
        <Texto variante="detalle" tono="suave" style={{ textAlign: 'center', maxWidth: 300 }}>
          {mensaje}
        </Texto>
      )}
      {accion && <Boton titulo={accion.titulo} onPress={accion.onPress} variante="tonal" tamano="compacto" style={{ marginTop: 8 }} />}
    </View>
  );
}

export function Superficie({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { color, radio } = useTema();
  return (
    <View
      style={[
        { backgroundColor: color.superficie, borderRadius: radio.l, borderColor: color.borde, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  insignia: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  chip: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  vacio: { alignItems: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  iconoVacio: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
