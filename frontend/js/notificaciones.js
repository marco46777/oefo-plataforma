/**
 * NOTIFICACIONES del navegador para entregas que vencen hoy o mañana.
 */

// ---- Notificaciones del navegador ----
const KEY_NOTIF = "oefo_notificadas_v1";
function yaNotificadas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY_NOTIF)) || []);
  } catch (e) {
    return new Set();
  }
}
function guardarNotificadas(set) {
  try {
    localStorage.setItem(KEY_NOTIF, JSON.stringify([...set]));
  } catch (e) {}
}

function revisarNotificaciones() {
  if (
    soloLectura ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  const notificadas = yaNotificadas();
  tareas
    .filter((t) => !t.hecha)
    .forEach((t) => {
      const d = diasRestantes(t.fecha);
      if ((d === 0 || d === 1) && !notificadas.has(t.id)) {
        try {
          new Notification(
            "OEFO — " + (d === 0 ? "Vence hoy" : "Vence mañana"),
            {
              body: `${t.nombre}${t.materia ? " · " + t.materia : ""}`,
            },
          );
        } catch (e) {}
        notificadas.add(t.id);
      }
    });
  guardarNotificadas(notificadas);
}
document.getElementById("btnNotif").addEventListener("click", async () => {
  const toast = document.getElementById("toast");
  if (!("Notification" in window)) {
    toast.textContent = "Este navegador no soporta notificaciones.";
    mostrarToast(3000);
    return;
  }
  const permiso = await Notification.requestPermission();
  if (permiso === "granted") {
    try {
      new Notification("OEFO", {
        body: "Listo — te avisaré cuando algo esté por vencer.",
      });
    } catch (e) {}
    revisarNotificaciones();
    document.getElementById("btnNotif").textContent = "🔔 Avisos activados";
  } else {
    toast.textContent =
      "No se activaron los avisos — puedes habilitarlos desde los permisos del sitio.";
    mostrarToast(4000);
  }
});
if ("Notification" in window && Notification.permission === "granted") {
  document.getElementById("btnNotif").textContent = "🔔 Avisos activados";
}
setInterval(revisarNotificaciones, 60000);
