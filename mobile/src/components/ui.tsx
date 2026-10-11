import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTema } from '@/theme';

type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: ViewStyle;
};

export function Boton({ titulo, onPress, variante = 'primario', cargando, deshabilitado, style }: BotonProps) {
  const tema = useTema();
  const primario = variante === 'primario';
  const inactivo = cargando || deshabilitado;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        estilos.boton,
        primario
          ? { backgroundColor: pressed ? tema.primaryHover : tema.primary }
          : { backgroundColor: tema.card, borderColor: tema.border, borderWidth: 1 },
        inactivo && { opacity: 0.6 },
        pressed && !primario && { opacity: 0.7 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={primario ? '#fff' : tema.primary} />
      ) : (
        <Text style={[estilos.botonTexto, { color: primario ? '#fff' : tema.text }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  const tema = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[estilos.etiqueta, { color: tema.textMuted }]}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor={tema.textMuted}
        {...props}
        style={[
          estilos.input,
          { backgroundColor: tema.card, borderColor: tema.border, color: tema.text },
          props.style,
        ]}
      />
    </View>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const tema = useTema();
  return (
    <View style={[estilos.tarjeta, { backgroundColor: tema.card, borderColor: tema.border }, style]}>
      {children}
    </View>
  );
}

export function Badge({ texto, color }: { texto: string; color: string }) {
  return (
    <View style={[estilos.badge, { backgroundColor: color }]}>
      <Text style={estilos.badgeTexto}>{texto}</Text>
    </View>
  );
}

export function Buscador(props: TextInputProps) {
  const tema = useTema();
  return (
    <TextInput
      placeholderTextColor={tema.textMuted}
      autoCorrect={false}
      {...props}
      style={[estilos.input, { backgroundColor: tema.card, borderColor: tema.border, color: tema.text, marginBottom: 4 }]}
    />
  );
}

export function TextoVacio({ error, cargando, texto }: { error: string | null; cargando: boolean; texto: string }) {
  const tema = useTema();
  if (cargando && !error) return null;
  return (
    <Text style={{ color: error ? tema.primary : tema.textMuted, textAlign: 'center', marginTop: 40 }}>
      {error ?? texto}
    </Text>
  );
}

type ModalFormularioProps = {
  visible: boolean;
  titulo: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  onCerrar: () => void;
  cargando?: boolean;
  children: ReactNode;
};

// Sustituye a los Swal.fire con inputs del frontend web
export function ModalFormulario({ visible, titulo, textoConfirmar, onConfirmar, onCerrar, cargando, children }: ModalFormularioProps) {
  const tema = useTema();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.fondoModal}
      >
        <View style={[estilos.modal, { backgroundColor: tema.card }]}>
          <Text style={[estilos.modalTitulo, { color: tema.text }]}>{titulo}</Text>
          {children}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} style={{ flex: 1 }} />
            <Boton titulo={textoConfirmar} onPress={onConfirmar} cargando={cargando} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Equivalente a los Swal.fire de confirmación de la web
export function confirmar(
  titulo: string,
  mensaje: string | undefined,
  textoConfirmar: string,
  accion: () => Promise<unknown>,
  destructivo = true,
) {
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: textoConfirmar,
      style: destructivo ? 'destructive' : 'default',
      onPress: () => {
        accion().catch((e: Error) => Alert.alert('Error', e.message));
      },
    },
  ]);
}

export const formatoMoneda = (n: number) =>
  `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const estilos = StyleSheet.create({
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modal: { borderRadius: 20, padding: 24, gap: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
  modalTitulo: { fontSize: 20, fontWeight: '800' },
  boton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  botonTexto: { fontSize: 16, fontWeight: '700' },
  etiqueta: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  tarjeta: { borderWidth: 1, borderRadius: 14, padding: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
