/**
 * INTELIGENCIA (2/3): cálculo de riesgo por tarea, por materia y global, y racha de días.
 */

function riesgoTarea(t) {
  if (t.hecha) return { nivel: "bajo", puntos: 0 };
  const d = diasRestantes(t.fecha);
  let p = t.tipo === "Examen" ? 3 : t.tipo === "Trabajo" ? 2 : 1;
  p += t.prioridad === "alta" ? 1 : 0;
  p += d < 0 ? 4 : d === 0 ? 3 : d <= 1 ? 2 : d <= 3 ? 1 : 0;
  const nivel =
    p >= 6 ? "critico" : p >= 4 ? "alto" : p >= 2 ? "medio" : "bajo";
  return { nivel, puntos: p };
}
function riesgoGlobal() {
  const pend = tareas.filter((t) => !t.hecha);
  if (pend.length === 0) return 4;
  const total = pend.reduce((s, t) => s + riesgoTarea(t).puntos, 0);
  return Math.min(100, Math.round((total / (pend.length * 7)) * 100));
}
function pendientesOrdenadas() {
  return tareas
    .filter((t) => !t.hecha)
    .sort((a, b) => riesgoTarea(b).puntos - riesgoTarea(a).puntos);
}
function riesgoPorMateria() {
  const mapa = {};
  tareas
    .filter((t) => !t.hecha && t.materia)
    .forEach((t) => {
      mapa[t.materia] = (mapa[t.materia] || 0) + riesgoTarea(t).puntos;
    });
  return Object.entries(mapa)
    .map(([materia, puntos]) => ({ materia, puntos }))
    .sort((a, b) => b.puntos - a.puntos);
}
function pesoPorMateria() {
  const mapa = {};
  tareas
    .filter((t) => !t.hecha && t.materia && t.peso)
    .forEach((t) => {
      mapa[t.materia] = (mapa[t.materia] || 0) + t.peso;
    });
  return mapa;
}

function actualizarRacha() {
  if (soloLectura) return rachaCompartida || 0;
  let r;
  try {
    r = JSON.parse(localStorage.getItem(KEY_RACHA)) || {
      dias: 0,
      ultimo: null,
    };
  } catch (e) {
    r = { dias: 0, ultimo: null };
  }
  const hoyStr = iso(hoy0());
  if (r.ultimo !== hoyStr) {
    const ayer = hoy0();
    ayer.setDate(ayer.getDate() - 1);
    r.dias = r.ultimo === iso(ayer) ? r.dias + 1 : 1;
    r.ultimo = hoyStr;
    localStorage.setItem(KEY_RACHA, JSON.stringify(r));
  }
  return r.dias;
}
