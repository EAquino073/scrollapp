import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { Celda, Laberinto } from '../../../domain/entities';
import { avanzarHacia, mismaCelda } from '../../../domain/minijuegos';
import { useTema } from '../../theme/tema';

interface Props {
  laberinto: Laberinto;
  onResuelto(): void;
}

type EstadoCelda = 'libre' | 'camino' | 'actual' | 'meta' | 'llegada';

interface PropsCelda {
  tamano: number;
  grosor: number;
  norte: boolean;
  este: boolean;
  sur: boolean;
  oeste: boolean;
  estado: EstadoCelda;
  colorPared: string;
  colorCamino: string;
  colorPunto: string;
  colorMeta: string;
}

/**
 * Una celda. Dibuja sus paredes este y sur (y las del borde exterior), para que cada pared
 * interior se dibuje una sola vez y todas tengan el mismo grosor.
 * Solo recibe valores simples, así `memo` evita redibujar las demás al moverse:
 * en cada paso cambian dos o tres celdas, no todo el tablero (importante en gama baja).
 */
function DibujoCelda(p: PropsCelda) {
  const punto = p.tamano * 0.56;
  const sinPared = 0;
  const paredes = {
    borderTopWidth: p.norte ? p.grosor : sinPared,
    borderRightWidth: p.este ? p.grosor : sinPared,
    borderBottomWidth: p.sur ? p.grosor : sinPared,
    borderLeftWidth: p.oeste ? p.grosor : sinPared,
  };
  return (
    <View style={[styles.celda, paredes, { width: p.tamano, height: p.tamano, borderColor: p.colorPared }]}>
      {p.estado === 'camino' ? (
        <View
          style={{
            width: p.tamano * 0.2,
            height: p.tamano * 0.2,
            borderRadius: p.tamano * 0.1,
            backgroundColor: p.colorCamino,
          }}
        />
      ) : null}
      {p.estado === 'meta' || p.estado === 'llegada' ? (
        <View
          style={[
            styles.anilloMeta,
            {
              width: punto,
              height: punto,
              borderRadius: punto / 2,
              borderColor: p.colorMeta,
            },
          ]}
        >
          {p.estado === 'llegada' ? (
            <View style={{ width: punto * 0.5, height: punto * 0.5, borderRadius: punto * 0.25, backgroundColor: p.colorPunto }} />
          ) : null}
        </View>
      ) : null}
      {p.estado === 'actual' ? (
        <View style={{ width: punto, height: punto, borderRadius: punto / 2, backgroundColor: p.colorPunto }} />
      ) : null}
    </View>
  );
}

const CeldaLaberinto = memo(DibujoCelda);

/**
 * Laberinto: se lleva el punto hasta el círculo ámbar arrastrando el dedo o tocando una
 * casilla vecina (o una de la misma fila o columna, si el pasillo está libre). Volver sobre
 * el camino lo deshace. Todo con Views; un solo PanResponder en el contenedor.
 */
function TableroLaberinto({ laberinto, onResuelto }: Props) {
  const { colores } = useTema();
  const n = laberinto.tamano;
  const [recorrido, setRecorrido] = useState<Celda[]>([laberinto.inicio]);
  const [tamanoCelda, setTamanoCelda] = useState(0);
  const recorridoRef = useRef(recorrido);
  const tamanoCeldaRef = useRef(0);
  const resueltoRef = useRef(false);

  const intentar = useCallback(
    (x: number, y: number) => {
      const t = tamanoCeldaRef.current;
      if (!t || resueltoRef.current) {
        return;
      }
      const limitar = (v: number) => Math.max(0, Math.min(n - 1, Math.floor(v / t)));
      const destino = { fila: limitar(y), columna: limitar(x) };
      const nuevo = avanzarHacia(laberinto, recorridoRef.current, destino);
      if (nuevo === recorridoRef.current) {
        return;
      }
      recorridoRef.current = nuevo;
      setRecorrido(nuevo);
      if (mismaCelda(nuevo[nuevo.length - 1], laberinto.meta)) {
        resueltoRef.current = true;
        onResuelto();
      }
    },
    [laberinto, n, onResuelto],
  );

  const intentarRef = useRef(intentar);
  useEffect(() => {
    intentarRef.current = intentar;
  }, [intentar]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: e => intentarRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: e => intentarRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;

  const alMedir = (e: LayoutChangeEvent) => {
    const t = Math.floor(e.nativeEvent.layout.width / n);
    tamanoCeldaRef.current = t;
    setTamanoCelda(t);
  };

  const enCamino = useMemo(() => new Set(recorrido.map(c => `${c.fila},${c.columna}`)), [recorrido]);
  const actual = recorrido[recorrido.length - 1];
  const grosor = n >= 8 ? 2 : 3;

  const estadoDe = (fila: number, columna: number): EstadoCelda => {
    const celda = { fila, columna };
    const esMeta = mismaCelda(celda, laberinto.meta);
    if (mismaCelda(celda, actual)) {
      return esMeta ? 'llegada' : 'actual';
    }
    if (esMeta) {
      return 'meta';
    }
    return enCamino.has(`${fila},${columna}`) ? 'camino' : 'libre';
  };

  return (
    <View style={styles.marco} onLayout={alMedir}>
      {tamanoCelda > 0 ? (
        <View
          style={{ width: tamanoCelda * n, height: tamanoCelda * n }}
          accessibilityLabel="Laberinto. Arrastra el dedo para llevar el punto hasta la meta."
          {...responder.panHandlers}
        >
          <View pointerEvents="none">
            {laberinto.pasos.map((fila, f) => (
              <View key={f} style={styles.fila}>
                {fila.map((pasos, c) => (
                  <CeldaLaberinto
                    key={c}
                    tamano={tamanoCelda}
                    grosor={grosor}
                    norte={f === 0}
                    este={!pasos.este}
                    sur={!pasos.sur}
                    oeste={c === 0}
                    estado={estadoDe(f, c)}
                    colorPared={colores.textoSuave}
                    colorCamino={colores.secundario}
                    colorPunto={colores.primario}
                    colorMeta={colores.acento}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const JuegoLaberinto = memo(TableroLaberinto);

const styles = StyleSheet.create({
  marco: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  fila: {
    flexDirection: 'row',
  },
  celda: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  anilloMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
