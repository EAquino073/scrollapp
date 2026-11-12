import React from 'react';
import type { ContenidoDelBanco } from '../../../domain/usecases';
import { GuiaEstiramiento } from './GuiaEstiramiento';
import { GuiaLectura } from './GuiaLectura';
import { GuiaMensaje } from './GuiaMensaje';
import { GuiaNota } from './GuiaNota';
import { GuiaReto } from './GuiaReto';
import { GuiaRespiracion } from './GuiaRespiracion';

interface Props {
  asignacion: ContenidoDelBanco;
  segundosTranscurridos: number;
  /** `true` cuando se cumplió el tiempo de la actividad. */
  terminado: boolean;
}

/** Elige la vista guiada según el tipo de actividad del contenido asignado. */
export function VistaContenidoGuiado({ asignacion, segundosTranscurridos, terminado }: Props) {
  switch (asignacion.tipo) {
    case 'ESTIRAR':
      return <GuiaEstiramiento estiramiento={asignacion.elemento} segundosTranscurridos={segundosTranscurridos} />;
    case 'RESPIRAR':
      return <GuiaRespiracion patron={asignacion.elemento} activo={!terminado} />;
    case 'ESCRIBIR':
      return <GuiaNota pregunta={asignacion.elemento} />;
    case 'LEER':
      return <GuiaLectura lectura={asignacion.elemento} />;
    case 'RETO_MENTE':
      return <GuiaReto reto={asignacion.elemento} />;
    case 'AGUA':
      return (
        <GuiaMensaje
          variante="ondas"
          principal={asignacion.elemento.mensaje}
          tituloDetalle="¿Sabías que…?"
          detalle={asignacion.elemento.dato}
          nota="Si ahora no tienes agua a mano, este par de minutos de pausa también cuenta."
          activo={!terminado}
        />
      );
    case 'CAMINAR':
      return (
        <GuiaMensaje
          variante="pasos"
          principal={asignacion.elemento.sugerencia}
          detalle={asignacion.elemento.detalle}
          nota="Si ahora no puedes caminar, basta con mover los pies en tu lugar."
          activo={!terminado}
        />
      );
    case 'OBSERVAR':
      return (
        <GuiaMensaje
          variante="mirada"
          principal={asignacion.elemento.reto}
          detalle={asignacion.elemento.detalle}
          nota="Sin prisa: aquí no hay respuestas correctas."
          activo={!terminado}
        />
      );
  }
}
