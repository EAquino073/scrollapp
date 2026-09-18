/**
 * Genera el código anónimo del participante con el formato `P-XXXX`.
 * Se omiten caracteres ambiguos (O/0, I/1, L) para poder dictarlo y transcribirlo
 * sin errores en las hojas del estudio. No contiene ningún dato personal.
 */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LONGITUD = 4;

export function generarCodigoParticipante(): string {
  let codigo = '';
  for (let i = 0; i < LONGITUD; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return `P-${codigo}`;
}

/** `true` si el texto tiene la forma `P-XXXX` con el alfabeto permitido. */
export function esCodigoParticipanteValido(codigo: string): boolean {
  return new RegExp(`^P-[${ALFABETO}]{${LONGITUD}}$`).test(codigo);
}
