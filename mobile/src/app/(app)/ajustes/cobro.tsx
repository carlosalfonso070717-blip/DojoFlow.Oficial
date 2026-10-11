import { router } from 'expo-router';
import { Minus, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { configurarCobro, obtenerConfiguracion, type ModoCobro } from '@/api/endpoints';
import { PantallaSecundaria } from '@/components/PantallaSecundaria';
import { Segmentos } from '@/components/Segmentos';
import { Boton, Grupo, ParDato, Texto } from '@/components/ui';
import { useTema } from '@/theme';

export default function CobroScreen() {
  const { color, tipografia } = useTema();
  const [modo, setModo] = useState<ModoCobro>('PorClase');
  const [paquetes, setPaquetes] = useState<string[]>([]);
  const [dia, setDia] = useState(15);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerConfiguracion()
      .then(({ cobro }) => {
        setModo(cobro.modoCobro);
        setPaquetes(cobro.preciosPaquete.map(String));
        setDia(cobro.diaVencimiento);
      })
      .finally(() => setListo(true));
  }, []);

  async function guardar() {
    const precios = paquetes.map((p) => parseFloat(p) || 0);
    if (modo === 'Paquete' && precios.length === 0) {
      Alert.alert('Falta un paquete', 'Agrega al menos el precio de 1 clase.');
      return;
    }
    setGuardando(true);
    try {
      await configurarCobro({ modoCobro: modo, preciosPaquete: precios, diaVencimiento: dia });
      router.back();
    } catch (e) {
      Alert.alert('No se pudo guardar', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (!listo) return null;

  return (
    <PantallaSecundaria
      titulo="Forma de cobro"
      descripcion="Aplica a las inscripciones nuevas. Las cuotas que ya existen no cambian."
      pie={<Boton titulo="Guardar cambios" onPress={guardar} cargando={guardando} />}
    >
      <View style={{ gap: 12 }}>
        <Segmentos<ModoCobro>
          valor={modo}
          onCambio={setModo}
          opciones={[
            { valor: 'PorClase', etiqueta: 'Por clase' },
            { valor: 'Paquete', etiqueta: 'Por paquete' },
          ]}
        />
        <Texto variante="detalle" tono="suave">
          {modo === 'PorClase'
            ? 'La cuota es la suma del precio de cada clase que toma la persona.'
            : 'La cuota depende de cuántas clases toma. Si toma más clases que paquetes, se usa el más grande.'}
        </Texto>
      </View>

      {modo === 'Paquete' && (
        <View style={{ gap: 10 }}>
          <Grupo>
            {paquetes.map((p, i) => (
              <View key={i} style={estilos.paquete}>
                <Texto variante="cuerpoFuerte" style={{ flex: 1 }}>
                  {i + 1} {i === 0 ? 'clase' : 'clases'}
                </Texto>
                <View style={[estilos.precio, { borderColor: color.borde, backgroundColor: color.fondo }]}>
                  <Texto variante="cuerpo" tono="tenue">
                    $
                  </Texto>
                  <TextInput
                    value={p}
                    onChangeText={(v) => setPaquetes((l) => l.map((x, j) => (j === i ? v.replace(/[^0-9.]/g, '') : x)))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={color.textoTenue}
                    accessibilityLabel={`Precio por ${i + 1} clases`}
                    style={[tipografia.cuerpoFuerte, { color: color.texto, width: 80, paddingVertical: 8, fontVariant: ['tabular-nums'] }]}
                  />
                </View>
                {i === paquetes.length - 1 ? (
                  <Pressable onPress={() => setPaquetes((l) => l.slice(0, -1))} hitSlop={10} accessibilityLabel="Quitar este paquete">
                    <X size={20} color={color.textoTenue} />
                  </Pressable>
                ) : (
                  <View style={{ width: 20 }} />
                )}
              </View>
            ))}
          </Grupo>
          <Boton titulo={`Agregar paquete de ${paquetes.length + 1} clases`} icono={Plus} variante="contorno" tamano="compacto" onPress={() => setPaquetes((l) => [...l, ''])} />
        </View>
      )}

      <Grupo titulo="Vencimiento">
        <ParDato etiqueta="Los recibos vencen el día">
          <View style={estilos.contador}>
            <Pressable
              onPress={() => setDia((d) => Math.max(1, d - 1))}
              style={[estilos.paso, { borderColor: color.borde }]}
              accessibilityLabel="Un día antes"
            >
              <Minus size={18} color={color.texto} />
            </Pressable>
            <Texto variante="subtitulo" cifras style={{ minWidth: 28, textAlign: 'center' }}>
              {dia}
            </Texto>
            <Pressable
              onPress={() => setDia((d) => Math.min(28, d + 1))}
              style={[estilos.paso, { borderColor: color.borde }]}
              accessibilityLabel="Un día después"
            >
              <Plus size={18} color={color.texto} />
            </Pressable>
          </View>
        </ParDato>
      </Grupo>
      <Texto variante="pequeno" tono="tenue">
        Del 1 al 28, para que exista en todos los meses. El recibo del mes siguiente aparece 7 días antes.
      </Texto>
    </PantallaSecundaria>
  );
}

const estilos = StyleSheet.create({
  paquete: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  precio: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paso: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
