import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { WaterSort } from '../../../domain/entities';
import { verter, waterSortResuelto } from '../../../domain/minijuegos';
import { Boton } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  waterSort: WaterSort;
  onResuelto(): void;
}

/** Nombres para lectores de pantalla, en el mismo orden que `colores.juego`. */
const NOMBRES = ['coral con círculo', 'verde con triángulo', 'ámbar con cuadrado', 'café con rombo'];

/** Figura que acompaña cada color: se distingue sin depender del tono. */
function Figura({ color, indice }: { color: string; indice: number }) {
  switch (indice % 4) {
    case 0:
      return <View style={[styles.circulo, { backgroundColor: color }]} />;
    case 1:
      return <View style={[styles.triangulo, { borderBottomColor: color }]} />;
    case 2:
      return <View style={[styles.cuadrado, { backgroundColor: color }]} />;
    default:
      return <View style={[styles.rombo, { backgroundColor: color }]} />;
  }
}

interface PropsBotella {
  capas: number[];
  capacidad: number;
  indice: number;
  seleccionada: boolean;
  ancho: number;
  alTocar(indice: number): void;
}

function DibujoBotella({ capas, capacidad, indice, seleccionada, ancho, alTocar }: PropsBotella) {
  const { colores } = useTema();
  const altoCapa = Math.round(ancho * 0.7);
  const descripcion =
    capas.length === 0 ? 'vacía' : `de abajo hacia arriba: ${capas.map(c => NOMBRES[c]).join(', ')}`;
  return (
    <Pressable
      onPress={() => alTocar(indice)}
      accessibilityRole="button"
      accessibilityLabel={`Botella ${indice + 1}, ${descripcion}`}
      accessibilityState={{ selected: seleccionada }}
      hitSlop={6}
      style={[
        styles.botella,
        seleccionada && styles.botellaSeleccionada,
        {
          width: ancho,
          height: altoCapa * capacidad + 10,
          borderColor: seleccionada ? colores.primario : colores.textoTenue,
          backgroundColor: colores.superficie,
        },
      ]}
    >
      {capas.map((color, i) => {
        const tono = colores.juego[color % colores.juego.length];
        return (
          <View
            key={i}
            style={[
              styles.capa,
              i === 0 && styles.capaFondo,
              { height: altoCapa, backgroundColor: tono.relleno },
            ]}
          >
            <Figura color={tono.simbolo} indice={color} />
          </View>
        );
      })}
    </Pressable>
  );
}

const Botella = memo(DibujoBotella);

/**
 * Water sort: se toca una botella y luego otra para verter el color de arriba, que solo cae
 * sobre el mismo color o en una botella vacía. Se resuelve cuando cada botella tiene un solo
 * color. Se puede deshacer o volver a empezar las veces que se quiera, sin penalización.
 */
function TableroWaterSort({ waterSort, onResuelto }: Props) {
  const [estado, setEstado] = useState(waterSort);
  const [historial, setHistorial] = useState<WaterSort[]>([]);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [resuelto, setResuelto] = useState(false);
  const [anchoDisponible, setAnchoDisponible] = useState(0);

  const tocar = (i: number) => {
    if (resuelto) {
      return;
    }
    if (seleccion === null) {
      setSeleccion(estado.botellas[i].length > 0 ? i : null);
      return;
    }
    if (seleccion === i) {
      setSeleccion(null);
      return;
    }
    const nuevo = verter(estado, seleccion, i);
    if (!nuevo) {
      // No se puede verter ahí: si la botella tiene color, pasa a ser la elegida.
      setSeleccion(estado.botellas[i].length > 0 ? i : null);
      return;
    }
    setHistorial(h => [...h, estado]);
    setEstado(nuevo);
    setSeleccion(null);
    if (waterSortResuelto(nuevo)) {
      setResuelto(true);
      onResuelto();
    }
  };

  const deshacer = () => {
    if (historial.length === 0 || resuelto) {
      return;
    }
    setEstado(historial[historial.length - 1]);
    setHistorial(h => h.slice(0, -1));
    setSeleccion(null);
  };

  const reiniciar = () => {
    if (resuelto) {
      return;
    }
    setEstado(waterSort);
    setHistorial([]);
    setSeleccion(null);
  };

  const cantidad = estado.botellas.length;
  const separacion = 12;
  const ancho =
    anchoDisponible > 0
      ? Math.min(58, Math.floor((anchoDisponible - separacion * (cantidad - 1)) / cantidad))
      : 0;

  return (
    <View
      style={styles.contenedor}
      onLayout={(e: LayoutChangeEvent) => setAnchoDisponible(e.nativeEvent.layout.width)}
    >
      {ancho > 0 ? (
        <View style={[styles.fila, { gap: separacion }]}>
          {estado.botellas.map((capas, i) => (
            <Botella
              key={i}
              capas={capas}
              capacidad={estado.capacidad}
              indice={i}
              seleccionada={seleccion === i}
              ancho={ancho}
              alTocar={tocar}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.acciones}>
        <Boton
          titulo="Deshacer"
          variante="texto"
          ancho={false}
          onPress={deshacer}
          deshabilitado={historial.length === 0 || resuelto}
        />
        <Boton
          titulo="Volver a empezar"
          variante="texto"
          ancho={false}
          onPress={reiniciar}
          deshabilitado={historial.length === 0 || resuelto}
        />
      </View>
      <Text style={styles.oculto} accessibilityLiveRegion="polite">
        {seleccion !== null ? `Botella ${seleccion + 1} elegida` : ''}
      </Text>
    </View>
  );
}

export const JuegoWaterSort = memo(TableroWaterSort);

const styles = StyleSheet.create({
  contenedor: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 14,
  },
  botella: {
    borderWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    padding: 3,
    flexDirection: 'column-reverse',
    overflow: 'hidden',
  },
  botellaSeleccionada: {
    transform: [{ translateY: -12 }],
  },
  capa: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: 1,
  },
  capaFondo: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  acciones: {
    flexDirection: 'row',
    gap: 8,
  },
  circulo: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  triangulo: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  cuadrado: {
    width: 11,
    height: 11,
  },
  rombo: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
  },
  oculto: {
    height: 0,
    opacity: 0,
  },
});
