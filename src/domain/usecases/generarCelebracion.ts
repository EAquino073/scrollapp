/**
 * Micro-celebraciones específicas: mencionan el hábito realizado y la red social que
 * se dejó de lado. Nunca frases genéricas de sistema.
 */
export interface Celebracion {
  icono: string;
  titulo: string;
  texto: string;
}

interface HabitoCelebrado {
  habitId: string;
  nombre: string;
  duracionMinutos: number;
}

function elegir<T>(opciones: T[], semilla: string): T {
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) {
    hash = (hash * 31 + semilla.charCodeAt(i)) >>> 0;
  }
  return opciones[hash % opciones.length];
}

export function generarCelebracion(habito: HabitoCelebrado, redSocial: string): Celebracion {
  const nombre = habito.nombre.toLowerCase();
  const minutos = habito.duracionMinutos;
  const semilla = `${habito.habitId}-${new Date().getHours()}`;

  const opciones: Celebracion[] = [
    {
      icono: '🌿',
      titulo: 'Eso fue tuyo',
      texto: `Elegiste ${nombre} en lugar de abrir ${redSocial}. Esos ${minutos} minutos fueron tuyos, no del algoritmo.`,
    },
    {
      icono: '☀️',
      titulo: `${habito.nombre}: hecho`,
      texto: `${redSocial} sigue ahí, y está bien. La diferencia es que hoy decidiste tú primero.`,
    },
    {
      icono: '🍃',
      titulo: 'Un pequeño desvío que cuenta',
      texto: `Cambiaste el impulso de entrar a ${redSocial} por ${nombre}. Cada vez que pasa, el impulso pesa un poco menos.`,
    },
    {
      icono: '💛',
      titulo: 'Qué bien se siente',
      texto: `${minutos} minutos de ${nombre} en vez de scroll. Nadie lo vio, pero tu cuerpo sí lo notó.`,
    },
  ];
  return elegir(opciones, semilla);
}

/** Mensaje amable cuando el hábito no se completó. No hay culpa: se registra y se sigue. */
export function generarMensajeNoCompletado(habito: HabitoCelebrado, redSocial: string): Celebracion {
  return {
    icono: '🌤️',
    titulo: 'Hoy no salió, y no pasa nada',
    texto: `Intentar ${habito.nombre.toLowerCase()} en vez de abrir ${redSocial} ya fue una pausa. Lo anotamos como parte del patrón, no como un fallo.`,
  };
}

/**
 * Mensaje cuando se salta un minijuego (fase 5). Sin nada negativo: saltar también es
 * una decisión válida, y el rato que se le dedicó ya fue una pausa.
 */
export function generarMensajeSalto(redSocial: string): Celebracion {
  return {
    icono: '🍃',
    titulo: 'Lo dejamos aquí por hoy',
    texto: `El rato que le dedicaste ya fue una pausa lejos de ${redSocial}. Otro día habrá otro reto, si te apetece.`,
  };
}
