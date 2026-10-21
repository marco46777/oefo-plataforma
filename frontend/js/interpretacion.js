/**
 * INTELIGENCIA (1/3): interpreta texto libre -> tarea estructurada (tipo, materia, prioridad, peso, fecha).
 * Copia de backend/logic.py para que la página funcione sin servidor.
 */

function interpretar(texto) {
  const t = texto.toLowerCase();
  let prioridad = /urgent|important|alta|crític/.test(t) ? "alta" : "normal";
  let tipo = /examen|parcial|quiz|sustentaci/.test(t)
    ? "Examen"
    : /trabajo|ensayo|proyecto|informe/.test(t)
      ? "Trabajo"
      : "Tarea";
  let fecha = null;
  const hoyIdx = new Date().getDay();
  if (/hoy/.test(t)) fecha = hoy0();
  else if (/mañana/.test(t) && !/pasado mañana/.test(t)) {
    fecha = hoy0();
    fecha.setDate(fecha.getDate() + 1);
  } else if (/pasado mañana/.test(t)) {
    fecha = hoy0();
    fecha.setDate(fecha.getDate() + 2);
  } else {
    const enX = t.match(/en (\d+) d[ií]as/);
    if (enX) {
      fecha = hoy0();
      fecha.setDate(fecha.getDate() + parseInt(enX[1]));
    } else {
      for (let i = 0; i < DIAS.length; i++) {
        if (t.includes(DIAS[i])) {
          let delta = (i - hoyIdx + 7) % 7;
          if (delta === 0) delta = 7;
          fecha = hoy0();
          fecha.setDate(fecha.getDate() + delta);
          break;
        }
      }
    }
  }
  if (!fecha) {
    fecha = hoy0();
    fecha.setDate(fecha.getDate() + 3);
  }
  const STOP = new Set([
    "el",
    "la",
    "los",
    "las",
    "de",
    "del",
    "al",
    "un",
    "una",
    "hoy",
    "mañana",
    "pasado",
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "urgente",
    "importante",
    "alta",
    "normal",
    "prioridad",
  ]);
  const capFrase = (s) =>
    s
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  let materia = "";
  const m = t.match(/\bde ([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+){0,2})/);
  if (m) {
    const palabras = m[1].split(/\s+/).filter((w) => w && !STOP.has(w));
    materia = capFrase(palabras.slice(0, 2).join(" "));
  }
  let peso = 0;
  const pesoM = t.match(/(\d{1,3})\s?%/);
  if (pesoM) peso = Math.min(100, parseInt(pesoM[1]));
  return {
    nombre: texto.trim().replace(/^./, (c) => c.toUpperCase()),
    materia,
    tipo,
    prioridad,
    peso,
    fecha: iso(fecha),
  };
}

const MODIF = new Set([
  "el",
  "la",
  "los",
  "las",
  "de",
  "del",
  "al",
  "un",
  "una",
  "hoy",
  "mañana",
  "pasado",
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "urgente",
  "importante",
  "alta",
  "normal",
  "prioridad",
  "vale",
  "pesa",
  "en",
  "días",
  "dias",
  "día",
  "dia",
  "nota",
  "muy",
  "con",
  "para",
  "es",
  "y",
  "que",
  "por",
]);
function soloModificadores(f) {
  const toks = f.toLowerCase().match(/[a-záéíóúñ]+|\d+%?/g) || [];
  return toks.length > 0 && toks.every((t) => MODIF.has(t) || /^\d/.test(t));
}
function dividirTareas(texto) {
  const partes = texto
    .split(
      /,| y (?=examen|parcial|quiz|sustentaci|trabajo|ensayo|proyecto|informe|tarea)/i,
    )
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  partes.forEach((p) => {
    if (out.length && soloModificadores(p)) out[out.length - 1] += ", " + p;
    else out.push(p);
  });
  return out.length ? out : [texto];
}
