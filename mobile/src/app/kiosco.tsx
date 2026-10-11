import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checarAsistencia, type ResultadoChequeo } from '@/api/endpoints';
import { Badge, Boton } from '@/components/ui';
import { useTema } from '@/theme';

const LARGO_PIN = 5;
const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'validando' }
  | { tipo: 'resultado'; data: ResultadoChequeo }
  | { tipo: 'error'; mensaje: string };

export default function KioscoScreen() {
  const tema = useTema();
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });

  async function validar() {
    if (pin.length !== LARGO_PIN) return;
    setEstado({ tipo: 'validando' });
    try {
      setEstado({ tipo: 'resultado', data: await checarAsistencia(pin) });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: (e as Error).message });
    }
  }

  function presionar(tecla: string) {
    if (tecla === '⌫') setPin((p) => p.slice(0, -1));
    else if (tecla === '✓') validar();
    else if (pin.length < LARGO_PIN) setPin((p) => p + tecla);
  }

  function cerrar() {
    setEstado({ tipo: 'inactivo' });
    setPin('');
  }

  return (
    <SafeAreaView style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={estilos.salir} hitSlop={12}>
        <Text style={{ color: tema.textMuted, fontWeight: '600' }}>✕ Salir</Text>
      </Pressable>

      <View style={estilos.centro}>
        <Text style={[estilos.titulo, { color: tema.text }]}>Registro de asistencia</Text>
        <Text style={{ color: tema.textMuted, fontSize: 16 }}>Ingresa tu PIN de 5 dígitos</Text>

        <View style={estilos.puntos}>
          {Array.from({ length: LARGO_PIN }).map((_, i) => (
            <View
              key={i}
              style={[
                estilos.punto,
                { borderColor: tema.primary, backgroundColor: i < pin.length ? tema.primary : 'transparent' },
              ]}
            />
          ))}
        </View>

        <View style={estilos.teclado}>
          {TECLAS.map((t) => {
            const esConfirmar = t === '✓';
            return (
              <Pressable
                key={t}
                onPress={() => presionar(t)}
                disabled={esConfirmar && pin.length !== LARGO_PIN}
                style={({ pressed }) => [
                  estilos.tecla,
                  { backgroundColor: esConfirmar ? tema.primary : tema.card, borderColor: tema.border },
                  esConfirmar && pin.length !== LARGO_PIN && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Text style={[estilos.teclaTexto, { color: esConfirmar ? '#fff' : tema.text }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Modal visible={estado.tipo !== 'inactivo'} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={estilos.fondoModal}>
          <View style={[estilos.modal, { backgroundColor: tema.card }]}>
            <ContenidoModal estado={estado} onCerrar={cerrar} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ContenidoModal({ estado, onCerrar }: { estado: Estado; onCerrar: () => void }) {
  const tema = useTema();

  if (estado.tipo === 'validando') {
    return (
      <>
        <ActivityIndicator size="large" color={tema.primary} />
        <Text style={[estilos.modalTitulo, { color: tema.text }]}>Validando en el servidor...</Text>
      </>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <>
        <Text style={[estilos.icono, { color: tema.primary }]}>✕</Text>
        <Text style={[estilos.modalTitulo, { color: tema.text }]}>Acceso denegado</Text>
        <Text style={{ color: tema.textMuted, textAlign: 'center' }}>{estado.mensaje}</Text>
        <Boton titulo="Intentar otra vez" variante="secundario" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
      </>
    );
  }

  if (estado.tipo !== 'resultado') return null;
  const { data } = estado;

  if (!data.permitirAcceso) {
    return (
      <>
        <Text style={[estilos.icono, { color: tema.primary }]}>✕</Text>
        <Text style={[estilos.modalTitulo, { color: tema.text }]}>Acceso restringido</Text>
        <Text style={[estilos.nombre, { color: tema.text }]}>{data.nombreCompleto}</Text>
        <Badge texto="RECIBO VENCIDO" color={tema.primary} />
        <Text style={{ color: tema.textMuted }}>Favor de pasar a administración.</Text>
        <Boton titulo="Cerrar" variante="secundario" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
      </>
    );
  }

  const pagado = data.estatusFinanciero === 'Pagado';
  return (
    <>
      <Text style={[estilos.icono, { color: tema.success }]}>✓</Text>
      <Text style={[estilos.modalTitulo, { color: tema.text }]}>¡Bienvenido al Tatami!</Text>
      <Text style={[estilos.nombre, { color: tema.text }]}>{data.nombreCompleto}</Text>
      <Badge texto={pagado ? 'CUOTA CUBIERTA' : 'PAGO PENDIENTE'} color={pagado ? tema.success : '#d4a017'} />
      <Boton titulo="Cerrar" onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
    </>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  salir: { position: 'absolute', top: 56, right: 24, zIndex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  titulo: { fontSize: 28, fontWeight: '800' },
  puntos: { flexDirection: 'row', gap: 16, marginVertical: 24 },
  punto: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  teclado: { flexDirection: 'row', flexWrap: 'wrap', width: 300, gap: 16, justifyContent: 'center' },
  tecla: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  teclaTexto: { fontSize: 30, fontWeight: '600' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modal: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, maxWidth: 420, width: '100%', alignSelf: 'center' },
  modalTitulo: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  nombre: { fontSize: 18, fontWeight: '700' },
  icono: { fontSize: 64, fontWeight: '800' },
});
