import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { Celda, Sudoku } from '../../../domain/entities';
import { conflictosSudoku, sudokuResuelto } from '../../../domain/minijuegos';
import { useTema } from '../../theme/tema';

interface Props {
  sudoku: Sudoku;
  onResuelto(): void;
}

interface PropsCelda {
  fila: number;
  columna: number;
  valor: number | null;
  fija: boolean;
  seleccionada: boolean;
  conflicto: boolean;
  tamano: number;
  bordeDerecho: number;
  bordeInferior: number;
  onTocar(fila: number, columna: number): void;
  colorTexto: string;
  colorPropio: string;
  colorBorde: string;
  fondoSeleccion: string;
  fondoConflicto: string;
  fondo: string;
}

function DibujoCelda(p: PropsCelda) {
  const fondo = p.seleccionada ? p.fondoSeleccion : p.conflicto ? p.fondoConflicto : p.fondo;
  return (
    <Pressable
      onPress={() => p.onTocar(p.fila, p.columna)}
      disabled={p.fija}
      accessibilityRole="button"
      accessibilityLabel={`Fila ${p.fila + 1}, columna ${p.columna + 1}: ${p.valor ?? 'vacía'}${
        p.fija ? ', dada' : ''
      }${p.conflicto ? ', se repite' : ''}`}
      accessibilityState={{ selected: p.seleccionada, disabled: p.fija }}
      style={[
        styles.celda,
        {
          width: p.tamano,
          height: p.tamano,
          backgroundColor: fondo,
          borderColor: p.colorBorde,
          borderRightWidth: p.bordeDerecho,
          borderBottomWidth: p.bordeInferior,
        },
      ]}
    >
      {p.valor !== null ? (
        <Text
          style={[
            p.fija ? styles.numeroFijo : styles.numeroPropio,
            { fontSize: p.tamano * 0.46, color: p.fija ? p.colorTexto : p.colorPropio },
          ]}
        >
          {p.valor}
        </Text>
      ) : null}
    </Pressable>
  );
}

const CeldaSudoku = memo(DibujoCelda);

/**
 * Sudoku de 4x4 o 6x6: se toca una casilla vacía y se elige un número. Los números que se
 * repiten en su fila, columna o recuadro se marcan con un fondo suave, sin tratarlos como
 * error. Al completarse sin repeticiones, se resuelve.
 */
function TableroSudoku({ sudoku, onResuelto }: Props) {
  const { colores, radios } = useTema();
  const { tamano, filasBloque, columnasBloque } = sudoku;
  const [tablero, setTablero] = useState(() => sudoku.inicial.map(fila => [...fila]));
  const [seleccion, setSeleccion] = useState<Celda | null>(null);
  const [resuelto, setResuelto] = useState(false);
  const [lado, setLado] = useState(0);

  const conflictos = useMemo(
    () => conflictosSudoku(tablero, filasBloque, columnasBloque),
    [columnasBloque, filasBloque, tablero],
  );

  // Tocar una casilla siempre la elige (volver a tocarla no la suelta: evita confusiones).
  const tocar = useCallback((fila: number, columna: number) => {
    setSeleccion(previa => (previa && previa.fila === fila && previa.columna === columna ? previa : { fila, columna }));
  }, []);

  const poner = (valor: number | null) => {
    if (!seleccion || resuelto || sudoku.inicial[seleccion.fila][seleccion.columna] !== null) {
      return;
    }
    const nuevo = tablero.map(fila => [...fila]);
    nuevo[seleccion.fila][seleccion.columna] = valor;
    setTablero(nuevo);
    if (sudokuResuelto(nuevo, filasBloque, columnasBloque)) {
      setResuelto(true);
      setSeleccion(null);
      onResuelto();
    }
  };

  const alMedir = (e: LayoutChangeEvent) => setLado(Math.min(e.nativeEvent.layout.width, 360));
  const borde = 2;
  const tamanoCelda = lado > 0 ? Math.floor((lado - borde * 2) / tamano) : 0;
  const puedeEscribir = !resuelto && seleccion !== null;

  return (
    <View style={styles.contenedor} onLayout={alMedir}>
      {tamanoCelda > 0 ? (
        <View
          style={[
            styles.tablero,
            { borderColor: colores.textoSuave, borderWidth: borde, borderRadius: radios.s },
          ]}
        >
          {tablero.map((fila, f) => (
            <View key={f} style={styles.fila}>
              {fila.map((valor, c) => (
                <CeldaSudoku
                  key={c}
                  fila={f}
                  columna={c}
                  valor={valor}
                  fija={sudoku.inicial[f][c] !== null}
                  seleccionada={seleccion?.fila === f && seleccion?.columna === c}
                  conflicto={conflictos[f][c]}
                  tamano={tamanoCelda}
                  bordeDerecho={c === tamano - 1 ? 0 : (c + 1) % columnasBloque === 0 ? 2 : 1}
                  bordeInferior={f === tamano - 1 ? 0 : (f + 1) % filasBloque === 0 ? 2 : 1}
                  onTocar={tocar}
                  colorTexto={colores.texto}
                  colorPropio={colores.primario}
                  colorBorde={colores.textoTenue}
                  fondoSeleccion={colores.primarioSuave}
                  fondoConflicto={colores.acentoSuave}
                  fondo={colores.superficie}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.teclado}>
        {Array.from({ length: tamano }, (_, i) => i + 1).map(n => (
          <Pressable
            key={n}
            onPress={() => poner(n)}
            disabled={!puedeEscribir}
            accessibilityRole="button"
            accessibilityLabel={`Poner ${n}`}
            style={({ pressed }) => [
              styles.tecla,
              {
                backgroundColor: colores.superficieSuave,
                borderColor: colores.borde,
                borderRadius: radios.m,
                opacity: !puedeEscribir ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.textoTecla, { color: colores.texto }]}>{n}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => poner(null)}
          disabled={!puedeEscribir}
          accessibilityRole="button"
          accessibilityLabel="Borrar la casilla"
          style={({ pressed }) => [
            styles.tecla,
            styles.teclaBorrar,
            {
              borderColor: colores.borde,
              borderRadius: radios.m,
              opacity: !puedeEscribir ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.textoBorrar, { color: colores.textoSuave }]}>Borrar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const JuegoSudoku = memo(TableroSudoku);

const styles = StyleSheet.create({
  contenedor: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 20,
  },
  tablero: {
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
  },
  celda: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroFijo: {
    fontWeight: '700',
  },
  numeroPropio: {
    fontWeight: '500',
  },
  teclado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tecla: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  teclaBorrar: {
    width: 84,
  },
  textoTecla: {
    fontSize: 20,
    fontWeight: '600',
  },
  textoBorrar: {
    fontSize: 15,
    fontWeight: '600',
  },
});
