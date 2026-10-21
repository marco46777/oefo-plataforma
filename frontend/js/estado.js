/**
 * ESTADO GLOBAL: claves de almacenamiento, lista de tareas y banderas de la app.
 * Se carga primero; los demás archivos leen y modifican estas variables.
 */

const KEY = "oefo_v3",
  KEY_RACHA = "oefo_racha_v3",
  KEY_CHAT = "oefo_chat_v3";
let tareas = [];
try {
  tareas = JSON.parse(localStorage.getItem(KEY)) || [];
} catch (e) {
  tareas = [];
}
// Migración silenciosa: si esta es la primera vez con la clave actual, recupera datos de versiones anteriores del prototipo
if (tareas.length === 0) {
  for (const k of ["oefo_v2", "oefo_tareas_v1"]) {
    try {
      const viejo = JSON.parse(localStorage.getItem(k));
      if (Array.isArray(viejo) && viejo.length) {
        tareas = viejo;
        localStorage.setItem(KEY, JSON.stringify(tareas));
        break;
      }
    } catch (e) {}
  }
}
let chatLog = [];
try {
  chatLog = JSON.parse(localStorage.getItem(KEY_CHAT)) || [];
} catch (e) {
  chatLog = [];
}
let filtro = "pendientes";
let editandoId = null;
let ultimaEliminada = null,
  deshacerTimer = null;
let soloLectura = false,
  rachaCompartida = null;
let modoServidor = false,
  syncTimer = null;

const hashVista = location.hash.match(/^#vista=(.+)$/);
if (hashVista) {
  try {
    const snap = JSON.parse(decodeURIComponent(atob(hashVista[1])));
    if (snap && Array.isArray(snap.tareas)) {
      tareas = snap.tareas;
      rachaCompartida = snap.racha || 0;
      soloLectura = true;
      document.body.classList.add("solo-lectura");
    }
  } catch (e) {}
}
const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const DIAS_ABR = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
