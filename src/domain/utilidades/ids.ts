/**
 * Genera identificadores de documento al estilo de Firestore (20 caracteres alfanuméricos).
 * Se generan en el dominio para que los casos de uso conozcan el ID antes de guardar.
 */
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generarId(longitud = 20): string {
  let id = '';
  for (let i = 0; i < longitud; i++) {
    id += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return id;
}
