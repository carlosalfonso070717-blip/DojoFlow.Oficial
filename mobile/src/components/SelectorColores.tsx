import { Check, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { mezclar, textoSobre } from '@/theme/color';
import { useTema } from '@/theme';
import { buscarColores, FAMILIAS, type Sugerencia } from '@/utils/colores';
import { Campo } from './Campo';
import { Presionable } from './Presionable';
import { Texto } from './Texto';

// Fondos sugeridos para la credencial a partir del color principal
export function fondosPara(primario: string, extra?: string) {
  return [
    ...new Set([
      extra ?? '#14161a',
      '#14161a',
      '#1f2937',
      mezclar(primario, '#000000', 0.72),
      mezclar(primario, '#000000', 0.45),
      mezclar(primario, '#ffffff', 0.88),
      '#c0c4c8',
      '#f7f7f5',
    ]),
  ];
}

const ACENTOS: Record<string, string> = {
  cafe: 'café', marron: 'marrón', purpura: 'púrpura', indigo: 'índigo', ambar: 'ámbar', champan: 'champán', carbon: 'carbón', carmesi: 'carmesí', salmon: 'salmón',
};
const bonito = (t: string) => {
  const conAcentos = t.split(' ').map((p) => ACENTOS[p] ?? p).join(' ');
  return conAcentos[0].toUpperCase() + conAcentos.slice(1);
};

function Muestra({ color, activo, onPress, tamano = 44 }: { color: string; activo: boolean; onPress: () => void; tamano?: number }) {
  return (
    <Presionable
      onPress={onPress}
      escala={0.9}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`Color ${color}`}
      style={[
        estilos.muestra,
        { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: color, borderColor: activo ? mezclar(color, '#000000', 0.35) : 'rgba(0,0,0,0.08)' },
      ]}
    >
      {activo && <Check size={tamano * 0.45} color={textoSobre(color)} strokeWidth={3} />}
    </Presionable>
  );
}

export function Muestras({ colores, elegido, onElegir }: { colores: string[]; elegido: string; onElegir: (c: string) => void }) {
  return (
    <View style={estilos.muestras} accessibilityRole="radiogroup">
      {colores.map((c) => (
        <Muestra key={c} color={c} activo={c.toLowerCase() === elegido.toLowerCase()} onPress={() => onElegir(c)} />
      ))}
    </View>
  );
}

// Par principal + fondo, como una credencial en miniatura
function Combinacion({ s, activa, onPress }: { s: Sugerencia; activa: boolean; onPress: () => void }) {
  const { color, radio } = useTema();
  return (
    <Presionable
      onPress={onPress}
      escala={0.95}
      accessibilityRole="radio"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={`Principal ${s.primario}, fondo ${s.secundario}`}
      style={[estilos.combinacion, { borderRadius: radio.m, borderColor: activa ? color.texto : color.borde, borderWidth: activa ? 2 : 1, backgroundColor: s.secundario }]}
    >
      <View style={[estilos.franja, { backgroundColor: s.primario }]} />
      <View style={[estilos.punto, { backgroundColor: s.primario }]} />
    </Presionable>
  );
}

type Props = {
  primario: string;
  secundario: string;
  onPrimario: (c: string) => void;
  onSecundario: (c: string) => void;
  sugerido?: { primario: string; secundario: string };
};

// Elegir colores: describirlos con palabras, o tomarlos de la paleta
export function SelectorColores({ primario, secundario, onPrimario, onSecundario, sugerido }: Props) {
  const { color } = useTema();
  const [descripcion, setDescripcion] = useState('');
  const sugerencias = useMemo(() => buscarColores(descripcion), [descripcion]);
  const familias = sugerido && !FAMILIAS.some((f) => f.colores.includes(sugerido.primario))
    ? [{ nombre: 'Sugerido', colores: [sugerido.primario] }, ...FAMILIAS]
    : FAMILIAS;

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12 }}>
        <Campo
          etiqueta="Describe tus colores"
          placeholder="Ej. naranja suave con plateado"
          value={descripcion}
          onChangeText={setDescripcion}
          icono={Sparkles}
          autoCorrect={false}
          returnKeyType="search"
          ayuda={
            descripcion.trim() && sugerencias.length === 0
              ? 'No reconocimos ese color. Prueba con "azul marino", "rosa pastel con dorado" o "verde menta".'
              : 'El primer color pinta botones y detalles; el que va después de "con" es el fondo.'
          }
        />
        {sugerencias.length > 0 && (
          <Animated.View entering={FadeIn.duration(200)} style={{ gap: 8 }}>
            <Texto variante="detalle" tono="suave">
              {bonito(sugerencias[0].etiqueta)}
            </Texto>
            <View style={estilos.combinaciones}>
              {sugerencias.map((s) => (
                <Combinacion
                  key={`${s.primario}${s.secundario}`}
                  s={s}
                  activa={s.primario === primario && s.secundario === secundario}
                  onPress={() => {
                    onPrimario(s.primario);
                    onSecundario(s.secundario);
                  }}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </View>

      <View style={{ gap: 16 }}>
        <Texto variante="subtitulo">Color principal</Texto>
        {familias.map((f) => (
          <View key={f.nombre} style={{ gap: 8 }}>
            <Texto variante="pequeno" tono="tenue">
              {f.nombre}
            </Texto>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
              {f.colores.map((c) => (
                <Muestra key={c} color={c} activo={c.toLowerCase() === primario.toLowerCase()} onPress={() => onPrimario(c)} tamano={40} />
              ))}
            </ScrollView>
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Texto variante="subtitulo">Fondo de la credencial</Texto>
        <Muestras colores={fondosPara(primario, sugerido?.secundario)} elegido={secundario} onElegir={onSecundario} />
        {![...fondosPara(primario, sugerido?.secundario)].some((c) => c.toLowerCase() === secundario.toLowerCase()) && (
          <View style={estilos.actual}>
            <View style={[estilos.puntoActual, { backgroundColor: secundario, borderColor: color.borde }]} />
            <Texto variante="pequeno" tono="tenue">
              Fondo elegido con tu descripción
            </Texto>
          </View>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  muestras: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muestra: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fila: { gap: 10, paddingRight: 8 },
  combinaciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  combinacion: { width: 92, height: 56, overflow: 'hidden', justifyContent: 'center', paddingLeft: 14 },
  franja: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  punto: { width: 22, height: 22, borderRadius: 11 },
  actual: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntoActual: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
});
