/**
 * MODO ENFOQUE: temporizador Pomodoro de 25 minutos sobre la tarea más urgente.
 */

// ---- Modo enfoque (Pomodoro) ----
const FOCUS_TOTAL = 25 * 60;
let focusRemaining = FOCUS_TOTAL,
  focusTimer = null,
  focusRunning = false;
function fmtTiempo(s) {
  const m = Math.floor(s / 60),
    r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function refreshFocusTask() {
  const top = pendientesOrdenadas()[0];
  document.getElementById("focusTask").textContent = top
    ? `${top.nombre}${top.materia ? " (" + top.materia + ")" : ""}`
    : "Nada pendiente por ahora";
}
function renderFocusRing() {
  document.getElementById("focusTime").textContent = fmtTiempo(focusRemaining);
  const c = 251,
    off = c * (1 - focusRemaining / FOCUS_TOTAL);
  document.getElementById("focusArc").setAttribute("stroke-dashoffset", off);
}
document.getElementById("focusStart").addEventListener("click", () => {
  if (focusRunning) return;
  focusRunning = true;
  focusTimer = setInterval(() => {
    focusRemaining--;
    renderFocusRing();
    if (focusRemaining <= 0) {
      clearInterval(focusTimer);
      focusRunning = false;
      document.getElementById("focusDone").classList.add("show");
      lanzarConfeti();
    }
  }, 1000);
});
document.getElementById("focusPause").addEventListener("click", () => {
  clearInterval(focusTimer);
  focusRunning = false;
});
document.getElementById("focusReset").addEventListener("click", () => {
  clearInterval(focusTimer);
  focusRunning = false;
  focusRemaining = FOCUS_TOTAL;
  document.getElementById("focusDone").classList.remove("show");
  renderFocusRing();
});
document.getElementById("focusComplete").addEventListener("click", () => {
  const top = pendientesOrdenadas()[0];
  if (top) {
    top.hecha = true;
    guardar();
  }
  document.getElementById("focusDone").classList.remove("show");
  focusRemaining = FOCUS_TOTAL;
  renderFocusRing();
  render();
});
renderFocusRing();
