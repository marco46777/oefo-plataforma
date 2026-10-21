/**
 * ARRANQUE: bienvenida inicial, primer render y conexión con el servidor. Se carga al final.
 */

if (!soloLectura && chatLog.length === 0) {
  chatLog.push({
    who: "bot",
    text: "Hola, soy OEFO. Pregúntame qué tienes pendiente o pídeme una recomendación.",
  });
  guardarChat();
}

// ---- Bienvenida (una sola vez por navegador, no aplica a vistas compartidas) ----
if (!soloLectura && !localStorage.getItem("oefo_onboard_v1")) {
  document.getElementById("onboardOverlay").classList.add("show");
}
document.getElementById("onboardCerrar").addEventListener("click", () => {
  document.getElementById("onboardOverlay").classList.remove("show");
  try {
    localStorage.setItem("oefo_onboard_v1", "1");
  } catch (e) {}
});

render();
revisarNotificaciones();
