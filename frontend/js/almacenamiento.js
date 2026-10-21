/**
 * ALMACENAMIENTO LOCAL: guarda tareas y chat en localStorage (y sincroniza con el servidor si existe).
 */

function guardar() {
  if (soloLectura) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(tareas));
  } catch (e) {}
  if (modoServidor) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(
      () =>
        api("/sync", {
          method: "POST",
          body: JSON.stringify({ tareas }),
        }).catch(() => setEstado(false)),
      300,
    );
  }
}
function guardarChat() {
  try {
    localStorage.setItem(KEY_CHAT, JSON.stringify(chatLog.slice(-12)));
  } catch (e) {}
}
