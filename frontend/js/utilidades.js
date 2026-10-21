/**
 * UTILIDADES: fechas, escape de HTML, enlace a Google Calendar, confeti y avisos (toast).
 */

function iso(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function hoy0() {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return h;
}
function diasRestantes(f) {
  return Math.round((new Date(f + "T00:00:00") - hoy0()) / 86400000);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;");
}

function enlaceGoogleCalendar(t) {
  const f = t.fecha.replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: t.nombre + (t.materia ? " — " + t.materia : ""),
    dates: `${f}/${f}`,
    details: `Creada en OEFO · ${t.tipo}${t.peso ? ` · vale ${t.peso}% de la nota` : ""}`,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

// ---- Confeti (un solo momento de celebración) ----
function lanzarConfeti() {
  const colores = ["#5B8DEF", "#2FD9A8", "#F5B342", "#FF5C72"];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colores[i % colores.length];
    p.style.animationDuration = 1 + Math.random() * 0.8 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

/** Muestra el aviso (#toast) ya con su texto puesto y lo oculta tras `ms` milisegundos. */
function mostrarToast(ms) {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), ms);
}
