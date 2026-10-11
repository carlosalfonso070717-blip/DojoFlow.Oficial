import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CircleCheck, CircleX, Delete, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checarAsistencia, obtenerMarcaKiosco, type MarcaAcademia, type ResultadoChequeo } from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { Avatar, Boton, Insignia, Presionable, Texto } from '@/components/ui';
import { IconoCandado } from '@/components/iconos/Iconly';
import { ProveedorTema, useTema } from '@/theme';

const LARGO_PIN = 5;
const SEGUNDOS_RESULTADO = 5;
const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'entrar'] as const;

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'validando' }
  | { tipo: 'resultado'; data: ResultadoChequeo }
  | { tipo: 'error'; mensaje: string };

// El kiosco se pinta con la marca de la academia vinculada, haya o no sesión de coach
export default function KioscoScreen() {
  const { tokenKiosco } = useSesion();
  const [academia, setAcademia] = useState<MarcaAcademia | null>(null);

  useEffect(() => {
    if (!tokenKiosco) return;
    obtenerMarcaKiosco(tokenKiosco)
      .then(setAcademia)
      .catch(() => setAcademia(null));
  }, [tokenKiosco]);

  const marca = academia ? { primario: academia.colorPrimario, secundario: academia.colorSecundario } : null;

  return (
    <ProveedorTema marca={marca}>
      {tokenKiosco ? <Terminal academia={academia} tokenKiosco={tokenKiosco} /> : <SinVincular />}
    </ProveedorTema>
  );
}

function salir() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function SinVincular() {
  const { color } = useTema();
  return (
    <SafeAreaView style={[estilos.centro, { backgroundColor: color.fondo, padding: 32, gap: 14 }]}>
      <IconoCandado size={44} color={color.textoSuave} />
      <Texto variante="encabezado" style={{ textAlign: 'center' }}>
        Este kiosco no está vinculado
      </Texto>
      <Texto variante="cuerpo" tono="suave" style={{ textAlign: 'center', maxWidth: 360 }}>
        Inicia sesión como coach en esta tablet y toca "Abrir kiosco" en Inicio.
      </Texto>
      <Boton titulo="Volver" variante="contorno" onPress={salir} style={{ marginTop: 8, minWidth: 200 }} />
    </SafeAreaView>
  );
}

function Terminal({ academia, tokenKiosco }: { academia: MarcaAcademia | null; tokenKiosco: string }) {
  const { color } = useTema();
  const { width } = useWindowDimensions();
  const horizontal = width >= 720;
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cerrarResultado() {
    if (cierre.current) clearTimeout(cierre.current);
    setEstado({ tipo: 'inactivo' });
    setPin('');
  }

  // En recepción nadie toca "cerrar": el resultado desaparece solo para el siguiente alumno
  function programarCierre() {
    if (cierre.current) clearTimeout(cierre.current);
    cierre.current = setTimeout(cerrarResultado, SEGUNDOS_RESULTADO * 1000);
  }

  useEffect(() => () => {
    if (cierre.current) clearTimeout(cierre.current);
  }, []);

  async function validar(pinCompleto: string) {
    setEstado({ tipo: 'validando' });
    try {
      const data = await checarAsistencia(pinCompleto, tokenKiosco);
      setEstado({ tipo: 'resultado', data });
      Haptics.notificationAsync(
        data.permitirAcceso ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: (e as Error).message });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    programarCierre();
  }

  function presionar(tecla: (typeof TECLAS)[number]) {
    if (tecla === 'borrar') setPin((p) => p.slice(0, -1));
    else if (tecla === 'entrar') {
      if (pin.length === LARGO_PIN) validar(pin);
    } else if (pin.length < LARGO_PIN) {
      const nuevo = pin + tecla;
      setPin(nuevo);
      // Al completar el quinto dígito se valida sin tener que tocar "entrar"
      if (nuevo.length === LARGO_PIN) validar(nuevo);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <Pressable onPress={salir} style={estilos.salir} hitSlop={14} accessibilityRole="button" accessibilityLabel="Salir del kiosco">
        <X size={26} color={color.textoTenue} />
      </Pressable>

      <View style={[estilos.cuerpo, horizontal && estilos.cuerpoHorizontal]}>
        <View style={[estilos.identidad, horizontal && { flex: 1 }]}>
          {academia && <Avatar nombre={academia.nombre} logoUrl={academia.logoUrl} tamano={horizontal ? 96 : 72} />}
          <Texto variante="titulo" style={{ textAlign: 'center' }} numberOfLines={2}>
            {academia?.nombre ?? 'Registro de asistencia'}
          </Texto>
          <Texto variante="cuerpo" tono="suave" style={{ textAlign: 'center' }}>
            Escribe tu PIN de 5 dígitos
          </Texto>

          <View style={estilos.puntos} accessibilityLabel={`${pin.length} de ${LARGO_PIN} dígitos`}>
            {Array.from({ length: LARGO_PIN }).map((_, i) => {
              const lleno = i < pin.length;
              return (
                <View
                  key={i}
                  style={[estilos.punto, { borderColor: lleno ? color.marca : color.bordeFuerte, backgroundColor: lleno ? color.marca : 'transparent' }]}
                />
              );
            })}
          </View>
        </View>

        <View style={[estilos.teclado, horizontal && { flex: 1 }]}>
          {TECLAS.map((t) => {
            const especial = t === 'borrar' || t === 'entrar';
            const entrarActivo = t === 'entrar' && pin.length === LARGO_PIN;
            return (
              <Presionable
                key={t}
                onPress={() => presionar(t)}
                escala={0.92}
                disabled={t === 'entrar' && !entrarActivo}
                accessibilityRole="button"
                accessibilityLabel={t === 'borrar' ? 'Borrar dígito' : t === 'entrar' ? 'Entrar' : t}
                style={[
                  estilos.tecla,
                  {
                    backgroundColor: entrarActivo ? color.marca : especial ? 'transparent' : color.superficie,
                    borderColor: especial ? 'transparent' : color.borde,
                  },
                ]}
              >
                {t === 'borrar' ? (
                  <Delete size={30} color={color.textoSuave} />
                ) : t === 'entrar' ? (
                  <CircleCheck size={34} color={entrarActivo ? color.sobreMarca : color.textoTenue} />
                ) : (
                  <Texto variante="cifra" style={{ fontSize: 32 }}>
                    {t}
                  </Texto>
                )}
              </Presionable>
            );
          })}
        </View>
      </View>

      <Modal visible={estado.tipo !== 'inactivo'} transparent animationType="none" onRequestClose={cerrarResultado}>
        <Animated.View entering={FadeIn.duration(160)} style={[estilos.centro, { backgroundColor: color.velo, padding: 24 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrarResultado} accessibilityLabel="Cerrar" />
          <Animated.View
            entering={ZoomIn.duration(220)}
            style={[estilos.resultado, { backgroundColor: color.superficieElevada }]}
          >
            <Resultado estado={estado} onCerrar={cerrarResultado} />
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function Resultado({ estado, onCerrar }: { estado: Estado; onCerrar: () => void }) {
  const { color } = useTema();

  if (estado.tipo === 'validando') {
    return (
      <>
        <ActivityIndicator size="large" color={color.marcaTexto} />
        <Texto variante="subtitulo">Buscando tu PIN</Texto>
      </>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <>
        <CircleX size={72} color={color.peligro} />
        <Texto variante="encabezado" style={{ textAlign: 'center' }}>
          PIN no encontrado
        </Texto>
        <Texto variante="cuerpo" tono="suave" style={{ textAlign: 'center' }}>
          {estado.mensaje}
        </Texto>
        <Boton titulo="Intentar de nuevo" variante="contorno" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
      </>
    );
  }

  if (estado.tipo !== 'resultado') return null;
  const { data } = estado;

  if (!data.permitirAcceso) {
    return (
      <>
        <TriangleAlert size={72} color={color.peligro} />
        <Texto variante="encabezado" style={{ textAlign: 'center' }}>
          {data.nombreCompleto}
        </Texto>
        <Insignia texto="Recibo vencido" tono="peligro" />
        <Texto variante="cuerpo" tono="suave" style={{ textAlign: 'center' }}>
          Pasa a recepción para ponerte al corriente antes de entrar.
        </Texto>
        <Boton titulo="Entendido" variante="contorno" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
      </>
    );
  }

  const pagado = data.estatusFinanciero === 'Pagado';
  return (
    <>
      <CircleCheck size={72} color={color.exito} />
      <Texto variante="encabezado" style={{ textAlign: 'center' }}>
        ¡Hola, {data.nombreCompleto.split(' ')[0]}!
      </Texto>
      <Insignia texto={pagado ? 'Cuota al corriente' : 'Pago pendiente este mes'} tono={pagado ? 'exito' : 'aviso'} />
      {data.disciplinas.length > 0 && (
        <Texto variante="detalle" tono="suave" style={{ textAlign: 'center' }}>
          {data.disciplinas.join(', ')}
        </Texto>
      )}
      <Boton titulo="Listo" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
    </>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  salir: { position: 'absolute', top: 56, right: 24, zIndex: 2 },
  cuerpo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32 },
  cuerpoHorizontal: { flexDirection: 'row', gap: 48, paddingHorizontal: 48 },
  identidad: { alignItems: 'center', gap: 10 },
  puntos: { flexDirection: 'row', gap: 16, marginTop: 18 },
  punto: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  teclado: { flexDirection: 'row', flexWrap: 'wrap', width: 312, gap: 18, justifyContent: 'center', alignItems: 'center' },
  tecla: { width: 88, height: 88, borderRadius: 44, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
  resultado: { borderRadius: 28, padding: 28, alignItems: 'center', gap: 14, maxWidth: 440, width: '100%' },
});
