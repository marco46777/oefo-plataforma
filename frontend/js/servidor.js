/**
 * COMUNICACIÓN CON EL SERVIDOR (API Flask). Si no hay servidor la app sigue en "modo local".
 */

async function api(ruta, opc) {
  const r = await fetch("/api" + ruta, {
    headers: { "Content-Type": "application/json" },
    ...opc,
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || "HTTP " + r.status);
  return datos;
}

function setEstado(ok) {
  modoServidor = ok;
  document.getElementById("estadoConexion").textContent = ok
    ? "🟢 Servidor conectado"
    : "⚪ Modo local (sin servidor)";
}

(async function iniciarServidor() {
  if (soloLectura) return;
  try {
    await api("/health");
    const remotas = (await api("/tareas")).tareas;
    setEstado(true);
    if (remotas.length === 0 && tareas.length > 0)
      guardar(); // primera vez: sube lo que había en este navegador
    else {
      tareas = remotas;
      try {
        localStorage.setItem(KEY, JSON.stringify(tareas));
      } catch (e) {}
      render();
    }
  } catch (e) {
    setEstado(false);
  }
})();
