import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSesion } from '@/auth/session';
import { Boton, Credencial, DatoCredencial, Texto } from '@/components/ui';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';
import { plural } from '@/utils/texto';

// El cierre del asistente: la credencial terminada es la recompensa
export default function PasoListo() {
  const { color, espacio } = useTema();
  const { borrador, vistaPrevia, token } = useRegistro();
  const { entrarConToken } = useSesion();
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  async function entrar() {
    if (!token) return;
    setEntrando(true);
    // Al guardar el token, Stack.Protected lleva al panel de la academia
    await entrarConToken(token);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <View style={[estilos.contenido, { padding: espacio.xl }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 8 }}>
          <Texto variante="titulo" style={{ fontSize: 34, lineHeight: 39 }}>
            Tu academia está lista
          </Texto>
          <Texto variante="cuerpo" tono="suave">
            Ya puedes inscribir {plural(borrador.terminoAlumno).toLowerCase()}, cobrar y abrir el kiosco.
          </Texto>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(250).springify().damping(15)}>
          <Credencial academia={vistaPrevia}>
            <DatoCredencial valor={String(borrador.clases.length)} etiqueta={borrador.clases.length === 1 ? 'Clase' : 'Clases'} fondo={borrador.colorSecundario} />
            <DatoCredencial valor="0" etiqueta={plural(borrador.terminoAlumno)} fondo={borrador.colorSecundario} />
          </Credencial>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={{ paddingHorizontal: espacio.xl, paddingBottom: 12 }}>
        <Boton titulo={`Entrar a ${borrador.nombreAcademia.trim()}`} onPress={entrar} cargando={entrando} />
      </Animated.View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenido: { flex: 1, justifyContent: 'center', gap: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
});
