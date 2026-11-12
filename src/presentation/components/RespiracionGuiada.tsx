import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';

export type FaseRespiracion = 'inhalar' | 'sostener' | 'exhalar' | 'pausa';

/** Tiempos de cada fase en segundos (0 = se omite) y, opcionalmente, su indicación. */
export interface PatronRespiracionAnimado {
  inhalar: number;
  sostener: number;
  exhalar: number;
  pausa: number;
  textos?: Partial<Record<FaseRespiracion, string>>;
}

/** Patrón de la pausa de fricción (modo fuerte): 4 s para inhalar y 4 s para exhalar. */
const PATRON_PAUSA: PatronRespiracionAnimado = { inhalar: 4, sostener: 0, exhalar: 4, pausa: 0 };

const TEXTOS: Record<FaseRespiracion, string> = {
  inhalar: 'Inhala despacio…',
  sostener: 'Sostén el aire…',
  exhalar: 'Suelta el aire…',
  pausa: 'Quédate en calma…',
};

const ORDEN: FaseRespiracion[] = ['inhalar', 'sostener', 'exhalar', 'pausa'];
const ESCALA_MAXIMA = 1.55;

interface Props {
  patron?: PatronRespiracionAnimado;
  /** Cuando es `false`, el círculo se detiene en reposo. */
  activo?: boolean;
  /** Muestra los segundos que quedan de cada fase. */
  mostrarSegundos?: boolean;
  grande?: boolean;
}

/**
 * Respiración guiada: un círculo que crece al inhalar, se queda quieto al sostener, se
 * encoge al exhalar y descansa en la pausa. Por defecto, 4 s por fase (pausa de fricción).
 * La animación usa el driver nativo; la indicación se calcula desde la hora de inicio.
 */
export function RespiracionGuiada({ patron = PATRON_PAUSA, activo = true, mostrarSegundos = false, grande = false }: Props) {
  const { colores, tipografia } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const [fase, setFase] = useState<{ nombre: FaseRespiracion; restantes: number }>({
    nombre: 'inhalar',
    restantes: patron.inhalar,
  });

  const { inhalar, sostener, exhalar, pausa, textos } = patron;
  const fases = useMemo(
    () =>
      ORDEN.map(nombre => ({ nombre, segundos: { inhalar, sostener, exhalar, pausa }[nombre] })).filter(
        f => f.segundos > 0,
      ),
    [inhalar, sostener, exhalar, pausa],
  );

  useEffect(() => {
    if (!activo) {
      Animated.timing(escala, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      return;
    }
    const pasos = fases.map(f => {
      const duracion = f.segundos * 1000;
      if (f.nombre === 'inhalar' || f.nombre === 'exhalar') {
        return Animated.timing(escala, {
          toValue: f.nombre === 'inhalar' ? ESCALA_MAXIMA : 1,
          duration: duracion,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });
      }
      return Animated.delay(duracion);
    });
    escala.setValue(1);
    const ciclo = Animated.loop(Animated.sequence(pasos));
    ciclo.start();

    const duracionCiclo = fases.reduce((suma, f) => suma + f.segundos, 0);
    const inicio = Date.now();
    const actualizar = () => {
      let t = ((Date.now() - inicio) / 1000) % duracionCiclo;
      for (const f of fases) {
        if (t < f.segundos) {
          const restantes = Math.max(1, Math.ceil(f.segundos - t));
          setFase(previa =>
            previa.nombre === f.nombre && previa.restantes === restantes ? previa : { nombre: f.nombre, restantes },
          );
          return;
        }
        t -= f.segundos;
      }
    };
    actualizar();
    const intervalo = setInterval(actualizar, 200);
    return () => {
      ciclo.stop();
      clearInterval(intervalo);
    };
  }, [activo, escala, fases]);

  const tamano = grande ? 220 : 150;
  const indicacion = textos?.[fase.nombre] ?? TEXTOS[fase.nombre];

  return (
    <View style={styles.contenedor} accessibilityLabel="Respiración guiada">
      <View style={[styles.zona, { width: tamano, height: tamano }]}>
        <Animated.View
          style={[
            styles.halo,
            {
              width: tamano * 0.6,
              height: tamano * 0.6,
              borderRadius: tamano * 0.3,
              backgroundColor: colores.primarioSuave,
              transform: [{ scale: escala }],
            },
          ]}
        />
        <View
          style={{
            width: tamano * 0.24,
            height: tamano * 0.24,
            borderRadius: tamano * 0.12,
            backgroundColor: colores.primario,
          }}
        />
      </View>
      {activo ? (
        <Text
          style={[tipografia.cuerpoFuerte, styles.indicacion, { color: colores.primario }]}
          accessibilityLiveRegion="polite"
        >
          {indicacion}
          {mostrarSegundos ? `  ${fase.restantes}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: 16,
  },
  zona: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  indicacion: {
    textAlign: 'center',
  },
});
