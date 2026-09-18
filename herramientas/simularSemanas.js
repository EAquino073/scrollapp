/**
 * Herramienta de pruebas (fase 4): simula el paso de semanas para un participante.
 *
 * No forma parte de la app: se ejecuta con Node desde la máquina de desarrollo y habla
 * con Firestore por REST, autenticándose como el propio usuario de prueba.
 *
 *   node herramientas/simularSemanas.js <correo> <contrasena> <semanas> [minutosPorDia]
 *
 * Qué hace:
 *  1. Retrasa `fechaRegistro` tantas semanas como se le pida, de modo que la app crea que
 *     el estudio empezó hace ese tiempo, y pone `tiempoUsoDiarioBaseline` a 0.
 *  2. Borra `estadisticasSemanales` y las metas posteriores a la semana 1, y deja una meta
 *     de observación por red, para que el cierre de semanas se recalcule desde cero.
 *  3. Siembra `registrosScroll` día a día para todas las redes, con los minutos indicados
 *     (bajando ~8 % por semana y con un día por semana por encima del límite), porque
 *     UsageStats solo conserva ~7 días.
 *
 * Después basta con abrir la app: al arrancar cierra las semanas pendientes, calcula la
 * línea base, genera las estadísticas y crea las metas progresivas.
 */
const fs = require('fs');
const path = require('path');

const PROYECTO = 'scroll-apoyo-conductual';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function apiKey() {
  const ruta = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
  return JSON.parse(fs.readFileSync(ruta, 'utf8')).client[0].api_key[0].current_key;
}

function generarId(longitud = 20) {
  let id = '';
  for (let i = 0; i < longitud; i++) {
    id += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return id;
}

function fechaISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

async function pedir(url, opciones) {
  const respuesta = await fetch(url, opciones);
  const texto = await respuesta.text();
  if (!respuesta.ok) {
    throw new Error(`${respuesta.status} ${texto}`);
  }
  return texto ? JSON.parse(texto) : {};
}

async function iniciarSesion(correo, contrasena) {
  const datos = await pedir(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: correo, password: contrasena, returnSecureToken: true }),
    },
  );
  return { token: datos.idToken, uid: datos.localId };
}

const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

async function consultar(token, coleccion, uid) {
  const filas = await pedir(`${BASE}:runQuery`, {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: coleccion }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: uid },
          },
        },
      },
    }),
  });
  return filas.filter(f => f.document).map(f => ({ id: f.document.name.split('/').pop(), campos: f.document.fields }));
}

async function main() {
  const [correo, contrasena, semanasTexto, minutosTexto] = process.argv.slice(2);
  if (!correo || !contrasena || !semanasTexto) {
    console.error('Uso: node herramientas/simularSemanas.js <correo> <contrasena> <semanas> [minutosPorDia]');
    process.exit(1);
  }
  const semanas = Number(semanasTexto);
  const minutosBase = Number(minutosTexto ?? 90);

  const { token, uid } = await iniciarSesion(correo, contrasena);
  console.log(`Usuario ${uid}`);

  // 1. Retrasar fechaRegistro
  const nuevaFecha = new Date();
  nuevaFecha.setDate(nuevaFecha.getDate() - semanas * 7);
  nuevaFecha.setHours(9, 0, 0, 0);
  await pedir(
    `${BASE}/usuarios/${uid}?updateMask.fieldPaths=fechaRegistro&updateMask.fieldPaths=tiempoUsoDiarioBaseline`,
    {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({
        fields: {
          fechaRegistro: { timestampValue: nuevaFecha.toISOString() },
          tiempoUsoDiarioBaseline: { integerValue: '0' },
        },
      }),
    },
  );
  console.log(`fechaRegistro = ${nuevaFecha.toISOString()} (hace ${semanas} semanas)`);

  // 2. Redes con meta
  const metas = await consultar(token, 'metasScroll', uid);
  const redes = Array.from(new Set(metas.map(m => m.campos.redSocial.stringValue)));
  if (redes.length === 0) {
    console.error('El usuario no tiene metas; completa primero el onboarding.');
    process.exit(1);
  }
  console.log(`Redes: ${redes.join(', ')}`);

  // 3. Reinicio limpio: estadísticas, metas posteriores a la semana 1 y registros previos
  const stats = await consultar(token, 'estadisticasSemanales', uid);
  for (const doc of stats) {
    await pedir(`${BASE}/estadisticasSemanales/${doc.id}`, { method: 'DELETE', headers: auth(token) });
  }
  const metaPorRed = new Map();
  for (const meta of metas) {
    const red = meta.campos.redSocial.stringValue;
    const semana = Number(meta.campos.numeroSemana.integerValue ?? 1);
    if (semana === 1 && !metaPorRed.has(red)) {
      // Se conserva (y reactiva) la meta de observación de cada red.
      metaPorRed.set(red, meta.id);
      await pedir(`${BASE}/metasScroll/${meta.id}?updateMask.fieldPaths=activo&updateMask.fieldPaths=limiteMinutosDiarios`, {
        method: 'PATCH',
        headers: auth(token),
        body: JSON.stringify({
          fields: { activo: { booleanValue: true }, limiteMinutosDiarios: { integerValue: '0' } },
        }),
      });
    } else {
      await pedir(`${BASE}/metasScroll/${meta.id}`, { method: 'DELETE', headers: auth(token) });
    }
  }
  const previos = await consultar(token, 'registrosScroll', uid);
  for (const doc of previos) {
    await pedir(`${BASE}/registrosScroll/${doc.id}`, { method: 'DELETE', headers: auth(token) });
  }
  console.log(
    `Reinicio: ${stats.length} estadísticas, ${metas.length - metaPorRed.size} metas y ${previos.length} registros borrados`,
  );

  // 4. Sembrar registrosScroll día a día (menos minutos cada semana, como si mejorara)
  const diasTotales = semanas * 7;
  let escritos = 0;
  for (let dia = 0; dia < diasTotales; dia++) {
    const fecha = new Date(nuevaFecha.getTime() + dia * 24 * 60 * 60 * 1000);
    if (fecha > new Date()) {
      break;
    }
    const semanaDelDia = Math.floor(dia / 7);
    for (const red of redes) {
      // Baja ~8 % por semana y varía un poco cada día, para que el patrón se note.
      const factorSemana = Math.pow(0.92, semanaDelDia);
      const variacion = 0.85 + ((dia * 7 + red.length) % 30) / 100;
      const minutos = Math.max(3, Math.round((minutosBase / redes.length) * factorSemana * variacion));
      const aperturas = Math.max(1, Math.round(minutos / 6));
      // Un día por semana se marca fuera del límite, para que la revisión no salga perfecta.
      const cumplio = semanaDelDia === 0 || dia % 7 !== 3;
      await pedir(`${BASE}/registrosScroll/${generarId()}`, {
        method: 'PATCH',
        headers: auth(token),
        body: JSON.stringify({
          fields: {
            userId: { stringValue: uid },
            targetId: { stringValue: metaPorRed.get(red) ?? '' },
            redSocial: { stringValue: red },
            fecha: { stringValue: fechaISO(fecha) },
            minutosUsados: { integerValue: String(minutos) },
            aperturas: { integerValue: String(aperturas) },
            cumplioLimite: { booleanValue: cumplio },
            timestamp: { timestampValue: fecha.toISOString() },
          },
        }),
      });
      escritos++;
    }
  }
  console.log(`Sembrados ${escritos} registros de uso`);
  console.log('Listo. Abre la app: al arrancar cerrará las semanas y creará las metas.');
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
