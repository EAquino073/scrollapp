/**
 * Paletas de color de ScrollApp (fase 3): cálidas y luminosas, pero suaves.
 * - Claro: crema luminoso de fondo, coral durazno como acento principal y verde salvia como
 *   secundario. Texto marrón cálido, nunca negro puro.
 * - Oscuro: azul noche suave (no negro), durazno claro como acento y salvia clara.
 * Los avisos usan terracota: se leen con calma, no como alarma.
 */
export interface PaletaColores {
  fondo: string;
  superficie: string;
  superficieSuave: string;
  /** Acento principal (botones, chips seleccionados, marca). */
  primario: string;
  primarioSuave: string;
  sobrePrimario: string;
  /** Acento secundario (progreso, celebraciones, detalles de calma). */
  secundario: string;
  secundarioSuave: string;
  /** Acento cálido de apoyo (mensajes destacados). */
  acento: string;
  acentoSuave: string;
  texto: string;
  textoSuave: string;
  textoTenue: string;
  borde: string;
  aviso: string;
  avisoFondo: string;
  sombra: string;
}

export const paletaClara: PaletaColores = {
  fondo: '#FFF8F1',
  superficie: '#FFFFFF',
  superficieSuave: '#FFF0E4',
  primario: '#C24B2E',
  primarioSuave: '#FFE1D2',
  sobrePrimario: '#FFFFFF',
  secundario: '#4F8F7C',
  secundarioSuave: '#DDEFE8',
  acento: '#F2B36F',
  acentoSuave: '#FFF0D6',
  texto: '#3A2E28',
  textoSuave: '#6E5F57',
  textoTenue: '#7F726A',
  borde: '#F1E4D8',
  aviso: '#A94D34',
  avisoFondo: '#FFE9E1',
  sombra: '#5A3F30',
};

export const paletaOscura: PaletaColores = {
  fondo: '#1F2430',
  superficie: '#2A3040',
  superficieSuave: '#343B4E',
  primario: '#F4A585',
  primarioSuave: '#4A3730',
  sobrePrimario: '#2A1A14',
  secundario: '#8FCDB9',
  secundarioSuave: '#2F4A42',
  acento: '#F5C98A',
  acentoSuave: '#4A3D2C',
  texto: '#F6F0E9',
  textoSuave: '#C6BBB2',
  textoTenue: '#8F8780',
  borde: '#3E4658',
  aviso: '#F2A48A',
  avisoFondo: '#4A3230',
  sombra: '#000000',
};
