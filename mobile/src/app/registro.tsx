import { CircleCheck, Lock, Mail, School, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  confirmarVerificacion,
  enviarVerificacion,
  obtenerTiposNegocio,
  registrarAcademia,
  type TipoNegocio,
} from '@/api/endpoints';
import { useSesion } from '@/auth/session';
import { Boton, Campo, Presionable, Texto } from '@/components/ui';
import { useTema } from '@/theme';

// Mismo flujo que login.html: datos de la academia → verificar correo con PIN → crear cuenta
export default function RegistroScreen() {
  const { color, espacio, radio } = useTema();
  const { entrarConToken } = useSesion();
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [nombreAcademia, setNombreAcademia] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [pinEnviado, setPinEnviado] = useState(false);
  const [correoVerificado, setCorreoVerificado] = useState('');
  const [ocupado, setOcupado] = useState<'enviar' | 'confirmar' | 'registrar' | null>(null);

  const verificado = correoVerificado !== '' && correoVerificado === email.trim().toLowerCase();

  useEffect(() => {
    obtenerTiposNegocio()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);

  async function ejecutar(accion: typeof ocupado, fn: () => Promise<void>) {
    setOcupado(accion);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Revisa los datos', (e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  const enviar = () =>
    ejecutar('enviar', async () => {
      if (!email.trim()) throw new Error('Escribe tu correo antes de verificarlo.');
      await enviarVerificacion(email.trim());
      setPinEnviado(true);
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
      if (!tipoNegocio) throw new Error('Elige qué tipo de academia es.');
      if (!verificado) throw new Error('Primero verifica tu correo.');
      const r = await registrarAcademia({ nombre, email: email.trim(), password, nombreAcademia: nombreAcademia.trim(), tipoNegocio });
      // Con el token guardado, Stack.Protected lleva directo al panel de la academia nueva
      await entrarConToken(r.token);
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[estilos.contenedor, { padding: espacio.xl }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 14 }}>
          <Texto variante="encabezado">Tu academia</Texto>
          <Campo
            etiqueta="Nombre de la academia"
            value={nombreAcademia}
            onChangeText={setNombreAcademia}
            placeholder="Ej. Escuela de Ballet Swan"
            autoCapitalize="words"
            icono={School}
          />

          <Texto variante="detalle" tono="suave">
            ¿Qué enseñan?
          </Texto>
          {/* Cada tipo muestra el color con el que arrancará la academia */}
          <View style={estilos.tipos}>
            {tipos.map((t) => {
              const activo = tipoNegocio === t.tipoNegocio;
              return (
                <Presionable
                  key={t.tipoNegocio}
                  onPress={() => setTipoNegocio(t.tipoNegocio)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                  style={[
                    estilos.tipo,
                    {
                      borderRadius: radio.m,
                      backgroundColor: color.superficie,
                      borderColor: activo ? t.colorPrimario : color.borde,
                      borderWidth: activo ? 2 : StyleSheet.hairlineWidth * 2,
                    },
                  ]}
                >
                  <View style={[estilos.muestra, { backgroundColor: t.colorPrimario }]} />
                  <Texto variante="detalle" style={{ fontFamily: activo ? 'Figtree_700Bold' : 'Figtree_500Medium' }}>
                    {t.tipoNegocio}
                  </Texto>
                </Presionable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <Texto variante="encabezado">Tu cuenta</Texto>
          <Campo etiqueta="Tu nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" icono={UserRound} />

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
            icono={Mail}
          />

          {verificado ? (
            <View style={[estilos.verificado, { backgroundColor: color.exitoSuave, borderRadius: radio.m }]}>
              <CircleCheck size={18} color={color.exito} />
              <Texto variante="detalle" tono="exito">
                Correo verificado
              </Texto>
            </View>
          ) : pinEnviado ? (
            <View style={{ gap: 10 }}>
              <Campo
                etiqueta="Código de verificación"
                ayuda={`Lo enviamos a ${email.trim()}. Vence en 15 minutos.`}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Boton titulo="Confirmar código" onPress={confirmar} cargando={ocupado === 'confirmar'} variante="tonal" />
              <Boton titulo="Reenviar código" variante="fantasma" tamano="compacto" onPress={enviar} cargando={ocupado === 'enviar'} />
            </View>
          ) : (
            <Boton titulo="Verificar correo" variante="tonal" onPress={enviar} cargando={ocupado === 'enviar'} />
          )}

          <Campo
            etiqueta="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icono={Lock}
            ayuda="Mínimo 6 caracteres."
            autoComplete="new-password"
          />
        </View>

        <Boton titulo="Crear academia" onPress={registrar} cargando={ocupado === 'registrar'} deshabilitado={!verificado} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 32, paddingBottom: 48, maxWidth: 520, width: '100%', alignSelf: 'center' },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  muestra: { width: 14, height: 14, borderRadius: 7 },
  verificado: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
});
