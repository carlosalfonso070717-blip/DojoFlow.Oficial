import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Segmentos } from '@/components/Segmentos';
import { Vidrio } from '@/components/Tarjetas';
import { Boton, Insignia, Presionable, Texto } from '@/components/ui';
import { useDiseno } from '@/hooks/useDiseno';
import { PantallaPaso } from '@/onboarding/PantallaPaso';
import { useRegistro } from '@/onboarding/RegistroContexto';
import { ahorroAnual, formatoPrecio, obtenerPlanes, precioDe } from '@/suscripciones/catalogo';
import type { IdPlan, Periodo, Plan } from '@/suscripciones/tipos';
import { ProveedorTema, useTema } from '@/theme';

// La cuenta ya existe: los planes se muestran con los colores que eligió para su academia
export default function PasoPlanes() {
  const { borrador } = useRegistro();
  return (
    <ProveedorTema marca={{ primario: borrador.colorPrimario, secundario: borrador.colorSecundario }}>
      <Planes />
    </ProveedorTema>
  );
}

function Planes() {
  const { setEleccion, eleccion } = useRegistro();
  const { ancho } = useDiseno();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>(eleccion?.periodo ?? 'mensual');
  const [elegido, setElegido] = useState<IdPlan | null>(eleccion?.plan.id ?? null);

  useEffect(() => {
    obtenerPlanes().then((lista) => {
      setPlanes(lista);
      // Arranca con el recomendado ya marcado: un toque menos para la mayoría
      setElegido((actual) => actual ?? lista.find((p) => p.recomendado)?.id ?? lista[0]?.id ?? null);
    });
  }, []);

  const plan = planes.find((p) => p.id === elegido);
  const columnas = ancho >= 960;

  function continuar() {
    if (!plan) return;
    setEleccion({ plan, periodo });
    router.push('/registro/pago');
  }

  return (
    <PantallaPaso
      paso="planes"
      sinAtras
      anchoMaximo={columnas ? 1040 : 560}
      titulo="Elige tu plan"
      descripcion="Tu academia ya está creada. Escoge cómo quieres crecer; puedes cambiar de plan cuando quieras."
      continuar={{
        titulo: plan ? `Continuar con ${plan.nombre} · ${formatoPrecio(precioDe(plan, periodo))}/${periodo === 'anual' ? 'año' : 'mes'}` : 'Elige un plan',
        onPress: continuar,
        deshabilitado: !plan,
      }}
    >
      <View style={{ maxWidth: 400 }}>
        <Segmentos<Periodo>
          valor={periodo}
          onCambio={setPeriodo}
          opciones={[
            { valor: 'mensual', etiqueta: 'Mensual' },
            { valor: 'anual', etiqueta: 'Anual · 2 meses gratis' },
          ]}
        />
      </View>

      <View style={[estilos.planes, columnas && estilos.planesFila]}>
        {planes.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(120 + i * 70).duration(380)} style={columnas ? { flex: 1 } : undefined}>
            <TarjetaPlan plan={p} periodo={periodo} elegido={p.id === elegido} onElegir={() => setElegido(p.id)} />
          </Animated.View>
        ))}
      </View>
    </PantallaPaso>
  );
}

function TarjetaPlan({ plan, periodo, elegido, onElegir }: { plan: Plan; periodo: Periodo; elegido: boolean; onElegir: () => void }) {
  const { color, radio } = useTema();
  const anual = periodo === 'anual';
  const precio = precioDe(plan, periodo);

  return (
    <Presionable
      onPress={onElegir}
      escala={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegido }}
      accessibilityLabel={`${plan.nombre}, ${formatoPrecio(precio)} ${anual ? 'al año' : 'al mes'}`}
      style={[
        estilos.tarjeta,
        {
          borderRadius: radio.xl + 2,
          backgroundColor: color.superficie,
          borderColor: elegido ? color.marcaTexto : color.contorno,
          borderTopColor: elegido ? color.marcaTexto : color.contornoLuz,
          borderWidth: elegido ? 1.5 : StyleSheet.hairlineWidth,
        },
        (elegido ? { boxShadow: `0 20px 44px -20px ${color.brillo}` } : { boxShadow: color.sombra }) as ViewStyle,
      ]}
    >
      <Vidrio radio={radio.xl + 1} />

      <View style={estilos.cabecera}>
        <Texto variante="encabezado" numberOfLines={1} style={{ flexShrink: 1 }}>
          {plan.nombre}
        </Texto>
        {plan.recomendado && <Insignia texto="Más elegido" tono="marca" />}
      </View>
      <Texto variante="detalle" tono="suave" style={{ marginTop: 4 }}>
        {plan.lema}
      </Texto>

      <View style={estilos.precio}>
        <Texto variante="cifra" cifras style={{ fontSize: 40, lineHeight: 44 }}>
          {formatoPrecio(precio)}
        </Texto>
        <Texto variante="detalle" tono="suave" style={{ marginBottom: 6 }}>
          {plan.moneda} / {anual ? 'año' : 'mes'}
        </Texto>
      </View>
      {/* Siempre ocupa su renglón: las tarjetas no brincan al cambiar de periodo */}
      <Texto variante="pequeno" tono={anual ? 'exito' : 'tenue'} style={{ marginTop: 4 }}>
        {anual ? `Ahorras ${formatoPrecio(ahorroAnual(plan))} al año` : `o ${formatoPrecio(plan.precioAnual)} pagando el año`}
      </Texto>

      <View style={[estilos.separador, { backgroundColor: color.borde }]} />

      <View style={estilos.beneficios}>
        {plan.beneficios.map((b) => (
          <View key={b} style={estilos.beneficio}>
            <View style={[estilos.palomita, { backgroundColor: color.marcaSuave }]}>
              <Check size={13} color={color.marcaTexto} strokeWidth={3} />
            </View>
            <Texto variante="detalle" style={{ flex: 1 }}>
              {b}
            </Texto>
          </View>
        ))}
      </View>

      {/* Empuja el botón al pie: en tres columnas quedan alineados aunque cambie el texto */}
      <View style={{ flexGrow: 1 }} />
      <Boton
        titulo={elegido ? 'Plan elegido' : `Elegir ${plan.nombre}`}
        icono={elegido ? Check : undefined}
        variante={elegido ? 'primario' : 'contorno'}
        tamano="compacto"
        onPress={onElegir}
        style={estilos.boton}
      />
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  planes: { gap: 16 },
  planesFila: { flexDirection: 'row', alignItems: 'stretch' },
  tarjeta: { padding: 24, flexGrow: 1 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  precio: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 20 },
  separador: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  beneficios: { gap: 12 },
  beneficio: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  palomita: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  boton: { marginTop: 24 },
});
