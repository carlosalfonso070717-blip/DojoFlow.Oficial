import { router } from 'expo-router';
import { Check, MapPin, Phone, Plus, Store, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import type { ComponentType } from 'react';
import { IconoSucursal, type PropsIcono } from '@/components/iconos/Iconly';
import { Boton, Campo, Presionable, Texto } from '@/components/ui';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro, type SucursalBorrador } from '@/onboarding/RegistroContexto';
import { useTema } from '@/theme';

const VACIA: SucursalBorrador = { nombre: '', direccion: '', telefono: '' };

export default function PasoSucursales() {
  const { color, radio } = useTema();
  const { borrador, actualizar } = useRegistro();
  const { variasSucursales: varias, sucursales } = borrador;

  const nombres = [borrador.nombreSucursal, ...sucursales.map((s) => s.nombre)].map((n) => n.trim().toLowerCase()).filter(Boolean);
  const repetidas = new Set(nombres.filter((n, i) => nombres.indexOf(n) !== i));
  const valido =
    !varias ||
    (borrador.nombreSucursal.trim().length > 0 && sucursales.length > 0 && sucursales.every((s) => s.nombre.trim()) && repetidas.size === 0);

  function elegir(v: boolean) {
    // La primera vez que dice que sí, ya aparece el formulario de la otra sucursal
    actualizar({ variasSucursales: v, sucursales: v && sucursales.length === 0 ? [VACIA] : sucursales });
  }

  const cambiar = (i: number, cambios: Partial<SucursalBorrador>) =>
    actualizar({ sucursales: sucursales.map((s, j) => (j === i ? { ...s, ...cambios } : s)) });

  const quitar = (i: number) => {
    const resto = sucursales.filter((_, j) => j !== i);
    actualizar({ sucursales: resto, variasSucursales: resto.length > 0 });
  };

  const repetido = (nombre: string) => (nombre.trim() && repetidas.has(nombre.trim().toLowerCase()) ? 'Ya usaste ese nombre' : null);

  const opcion = (valor: boolean, Icono: ComponentType<PropsIcono>, titulo: string, detalle: string) => {
    const activo = varias === valor;
    return (
      <Presionable
        onPress={() => elegir(valor)}
        accessibilityRole="radio"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={titulo}
        style={[
          estilos.tarjeta,
          {
            borderRadius: radio.l,
            backgroundColor: color.superficie,
            borderColor: activo ? color.texto : color.borde,
            borderWidth: activo ? 2 : StyleSheet.hairlineWidth * 2,
          },
        ]}
      >
        <View style={estilos.cabecera}>
          <View style={[estilos.icono, { backgroundColor: activo ? color.marca : color.fondo }]}>
            <Icono size={22} color={activo ? color.sobreMarca : color.texto} strokeWidth={1.8} />
          </View>
          {activo && <Check size={18} color={color.texto} strokeWidth={2.6} />}
        </View>
        <Texto variante="cuerpoFuerte">{titulo}</Texto>
        <Texto variante="pequeno" tono="tenue">
          {detalle}
        </Texto>
      </Presionable>
    );
  };

  return (
    <PantallaPaso
      paso="sucursales"
      titulo="¿Tienes varias sucursales?"
      descripcion="Cada sucursal lleva sus propios alumnos, cobros e inventario, con la misma marca. Puedes agregar más después en Ajustes."
      continuar={{ onPress: () => router.push('/registro/cuenta'), deshabilitado: !valido }}
    >
      <View style={estilos.rejilla}>
        {opcion(false, Store, 'Solo una', 'Todo en un mismo lugar')}
        {opcion(true, IconoSucursal, 'Tengo varias', 'Cambia entre ellas desde el menú')}
      </View>

      {varias && (
        <Animated.View entering={FadeInDown.duration(320)} layout={LinearTransition.duration(260)} style={{ gap: 14 }}>
          <Campo
            etiqueta="¿Cómo le dices a esta sucursal?"
            placeholder="Ej. Centro"
            value={borrador.nombreSucursal}
            onChangeText={(v) => actualizar({ nombreSucursal: v })}
            autoCapitalize="sentences"
            icono={IconoSucursal}
            ayuda="Es la principal: con la que entras al iniciar sesión."
            error={repetido(borrador.nombreSucursal)}
            maxLength={80}
          />

          {sucursales.map((s, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(300)}
              exiting={FadeOut.duration(180)}
              layout={LinearTransition.duration(260)}
              style={[estilos.sucursal, { borderRadius: radio.l, backgroundColor: color.superficie, borderColor: color.borde }]}
            >
              <View style={estilos.titulo}>
                <Texto variante="cuerpoFuerte" style={{ flex: 1 }}>
                  {sucursales.length > 1 ? `Otra sucursal (${i + 1})` : 'Otra sucursal'}
                </Texto>
                <Pressable onPress={() => quitar(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Quitar sucursal">
                  <X size={20} color={color.textoTenue} />
                </Pressable>
              </View>
              <Campo
                etiqueta="Nombre"
                placeholder="Ej. Norte"
                value={s.nombre}
                onChangeText={(v) => cambiar(i, { nombre: v })}
                autoCapitalize="sentences"
                error={repetido(s.nombre)}
                maxLength={80}
                compacto
              />
              <Campo
                etiqueta="Dirección (opcional)"
                placeholder="Calle, número y colonia"
                value={s.direccion}
                onChangeText={(v) => cambiar(i, { direccion: v })}
                autoCapitalize="sentences"
                icono={MapPin}
                maxLength={200}
                compacto
              />
              <Campo
                etiqueta="Teléfono (opcional)"
                value={s.telefono}
                onChangeText={(v) => cambiar(i, { telefono: v })}
                keyboardType="phone-pad"
                icono={Phone}
                maxLength={30}
                compacto
              />
            </Animated.View>
          ))}

          <Boton
            titulo="Agregar otra sucursal"
            icono={Plus}
            variante="contorno"
            tamano="compacto"
            onPress={() => actualizar({ sucursales: [...sucursales, VACIA] })}
          />
        </Animated.View>
      )}
    </PantallaPaso>
  );
}

const estilos = StyleSheet.create({
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tarjeta: { width: '47%', flexGrow: 1, padding: 16, gap: 4 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  icono: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sucursal: { padding: 16, gap: 12, borderWidth: StyleSheet.hairlineWidth * 2 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
