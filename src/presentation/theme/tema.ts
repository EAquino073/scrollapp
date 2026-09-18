import { useMemo } from 'react';
import { useColorScheme, type TextStyle, type ViewStyle } from 'react-native';
import { paletaClara, paletaOscura, type PaletaColores } from './colores';

/**
 * Sistema de diseño de ScrollApp: espaciado generoso, bordes redondeados y una
 * tipografía con jerarquía clara. Todo componente y pantalla obtiene el tema con
 * `useTema()` para respetar el modo claro/oscuro del sistema.
 */
export const espaciado = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radios = {
  s: 8,
  m: 12,
  l: 20,
  xl: 28,
  redondo: 999,
} as const;

export const duraciones = {
  corta: 150,
  media: 280,
  larga: 450,
} as const;

export interface Tipografia {
  titulo: TextStyle;
  tituloMediano: TextStyle;
  subtitulo: TextStyle;
  cuerpo: TextStyle;
  cuerpoFuerte: TextStyle;
  etiqueta: TextStyle;
  pequeno: TextStyle;
  marca: TextStyle;
  numeroGrande: TextStyle;
}

export interface Tema {
  colores: PaletaColores;
  esOscuro: boolean;
  espaciado: typeof espaciado;
  radios: typeof radios;
  duraciones: typeof duraciones;
  tipografia: Tipografia;
  sombraSuave: ViewStyle;
}

function crearTipografia(colores: PaletaColores): Tipografia {
  return {
    titulo: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colores.texto },
    tituloMediano: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colores.texto },
    subtitulo: { fontSize: 16, lineHeight: 24, color: colores.textoSuave },
    cuerpo: { fontSize: 16, lineHeight: 24, color: colores.texto },
    cuerpoFuerte: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: colores.texto },
    etiqueta: { fontSize: 14, lineHeight: 20, color: colores.textoSuave },
    pequeno: { fontSize: 13, lineHeight: 18, color: colores.textoTenue },
    marca: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colores.primario,
    },
    numeroGrande: { fontSize: 44, lineHeight: 52, fontWeight: '700', color: colores.primario },
  };
}

export function crearTema(esquema: 'light' | 'dark' | null | undefined): Tema {
  const esOscuro = esquema === 'dark';
  const colores = esOscuro ? paletaOscura : paletaClara;
  return {
    colores,
    esOscuro,
    espaciado,
    radios,
    duraciones,
    tipografia: crearTipografia(colores),
    sombraSuave: {
      shadowColor: colores.sombra,
      shadowOpacity: esOscuro ? 0.3 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: esOscuro ? 1 : 2,
    },
  };
}

/** Tema actual según el esquema de color del sistema. */
export function useTema(): Tema {
  const esquema = useColorScheme();
  return useMemo(() => crearTema(esquema), [esquema]);
}

/**
 * Crea estilos derivados del tema una sola vez por cambio de tema.
 * `crear` debe definirse fuera del componente para que sea estable.
 */
export function useEstilos<T>(crear: (tema: Tema) => T): T {
  const tema = useTema();
  return useMemo(() => crear(tema), [crear, tema]);
}
