import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  confirmarVerificacion,
  enviarVerificacion,
  obtenerTiposNegocio,
  registrarAcademia,
  type TipoNegocio,
} from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { Boton, Campo, Tarjeta } from '@/components/ui';
import { useTema } from '@/theme';

// Mismo flujo que login.html: datos de la academia → verificar correo con PIN → crear cuenta
export default function RegistroScreen() {
  const tema = useTema();
  const { entrarConToken } = useSesion();
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [nombreAcademia, setNombreAcademia] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    obtenerTiposNegocio()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);
  const [pinEnviado, setPinEnviado] = useState(false);
  const [correoVerificado, setCorreoVerificado] = useState('');
  const [ocupado, setOcupado] = useState<'enviar' | 'confirmar' | 'registrar' | null>(null);

  const verificado = correoVerificado !== '' && correoVerificado === email.trim().toLowerCase();

  async function ejecutar(accion: typeof ocupado, fn: () => Promise<void>) {
    setOcupado(accion);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Atención', (e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  const enviar = () =>
    ejecutar('enviar', async () => {
      if (!email.trim()) throw new Error('Escribe tu correo antes de verificarlo.');
      const r = await enviarVerificacion(email.trim());
      setPinEnviado(true);
      Alert.alert('Revisa tu correo', r.mensaje);
    });

  const confirmar = () =>
    ejecutar('confirmar', async () => {
      if (!pin.trim()) throw new Error('Escribe el código que te llegó por correo.');
      await confirmarVerificacion(email.trim(), pin.trim());
      setCorreoVerificado(email.trim().toLowerCase());
      setPinEnviado(false);
    });

  const registrar = () =>
    ejecutar('registrar', async () => {
      if (!nombreAcademia.trim()) throw new Error('Escribe el nombre de tu academia.');
      if (!tipoNegocio) throw new Error('Elige el tipo de academia.');
      if (!verificado) throw new Error('Primero debes verificar tu correo.');
      const r = await registrarAcademia({ nombre, email: email.trim(), password, nombreAcademia, tipoNegocio });
      // Con el token guardado, Stack.Protected lleva directo al panel de la academia nueva
      await entrarConToken(r.token);
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <Tarjeta style={{ gap: 16 }}>
          <Text style={[estilos.seccion, { color: tema.text }]}>Tu academia</Text>
          <Campo
            etiqueta="Nombre de la academia"
            value={nombreAcademia}
            onChangeText={setNombreAcademia}
            placeholder="Ej. Escuela de Ballet Swan"
            autoCapitalize="words"
          />

          <Text style={[estilos.etiqueta, { color: tema.textMuted }]}>Tipo de academia</Text>
          <View style={estilos.chips}>
            {tipos.map((t) => {
              const activo = tipoNegocio === t.tipoNegocio;
              return (
                <Pressable
                  key={t.tipoNegocio}
                  onPress={() => setTipoNegocio(t.tipoNegocio)}
                  style={[
                    estilos.chip,
                    { borderColor: t.colorPrimario, backgroundColor: activo ? t.colorPrimario : 'transparent' },
                  ]}
                >
                  <Text style={{ color: activo ? '#fff' : tema.text, fontWeight: '700' }}>{t.tipoNegocio}</Text>
                </Pressable>
              );
            })}
          </View>
        </Tarjeta>

        <Tarjeta style={{ gap: 16 }}>
          <Text style={[estilos.seccion, { color: tema.text }]}>Tu cuenta</Text>
          <Campo etiqueta="Tu nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" />

          <Campo
            etiqueta="Correo"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setPinEnviado(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {verificado ? (
            <Text style={{ color: tema.success, fontWeight: '700' }}>✓ Correo verificado</Text>
          ) : pinEnviado ? (
            <View style={{ gap: 10 }}>
              <Campo
                etiqueta="Código de verificación"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Boton titulo="Confirmar código" onPress={confirmar} cargando={ocupado === 'confirmar'} />
              <Text onPress={enviar} style={{ color: tema.primary, fontWeight: '600', textAlign: 'center' }}>
                Reenviar código
              </Text>
            </View>
          ) : (
            <Boton titulo="Verificar correo" variante="secundario" onPress={enviar} cargando={ocupado === 'enviar'} />
          )}

          <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />

          <Boton
            titulo="Crear academia"
            onPress={registrar}
            cargando={ocupado === 'registrar'}
            deshabilitado={!verificado}
          />
        </Tarjeta>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  seccion: { fontSize: 18, fontWeight: '800' },
  etiqueta: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
