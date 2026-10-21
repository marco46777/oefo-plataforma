/**
 * COMPARTIR: copiar el plan de la semana y generar/abrir un enlace de solo lectura.
 */

// ---- Compartir plan semanal ----
document.getElementById("btnCompartir").addEventListener("click", async () => {
  const pend = pendientesOrdenadas().sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha),
  );
  let texto = "📅 Plan de la semana — OEFO\n\n";
  if (pend.length === 0) texto += "Sin pendientes por ahora.";
  else
    pend.forEach((t) => {
      const d = diasRestantes(t.fecha);
      const cuando =
        d < 0
          ? `Atrasada ${Math.abs(d)}d`
          : d === 0
            ? "Hoy"
            : d === 1
              ? "Mañana"
              : `En ${d} días`;
      texto += `• ${t.nombre}${t.materia ? " (" + t.materia + ")" : ""} — ${cuando}\n`;
    });
  const toast = document.getElementById("toast");
  try {
    await navigator.clipboard.writeText(texto);
    toast.textContent = "📋 Plan copiado — pégalo en tu chat de grupo.";
  } catch (e) {
    toast.textContent =
      "No se pudo copiar automáticamente. Selecciona y copia el plan manualmente.";
  }
  mostrarToast(4000);
});

// ---- Compartir vista de solo lectura (sin backend, todo va en el enlace) ----
document
  .getElementById("btnCompartirVista")
  .addEventListener("click", async () => {
    const payload = {
      tareas,
      racha: actualizarRacha(),
      generadoEl: iso(hoy0()),
    };
    const enlace =
      location.origin +
      location.pathname +
      "#vista=" +
      btoa(encodeURIComponent(JSON.stringify(payload)));
    const toast = document.getElementById("toast");
    try {
      await navigator.clipboard.writeText(enlace);
      toast.textContent =
        "🔗 Enlace copiado — quien lo abra ve tu semana en solo lectura, sin poder editarla.";
    } catch (e) {
      toast.textContent = "No se pudo copiar automáticamente: " + enlace;
    }
    mostrarToast(6000);
  });

// ---- Banner de modo solo-lectura ----
if (soloLectura) {
  const banner = document.createElement("div");
  banner.className = "card banner-lectura";
  banner.innerHTML = `👀 Estás viendo la semana de alguien más — modo solo lectura, no se guarda nada aquí. <button class="linklike" id="btnPropio">Crear mi propio OEFO</button>`;
  document.querySelector(".wrap").prepend(banner);
  document.getElementById("btnPropio").addEventListener("click", () => {
    history.replaceState(null, "", location.pathname);
    location.reload();
  });
}
