/**
 * ACCIONES DEL USUARIO: agregar/editar/eliminar tareas, preguntar al asistente, filtros,
 * formulario manual y copia de seguridad (exportar/importar).
 */

function eliminarConDeshacer(id) {
  const idx = tareas.findIndex((x) => x.id === id);
  if (idx === -1) return;
  ultimaEliminada = { tarea: tareas[idx], idx };
  tareas.splice(idx, 1);
  guardar();
  render();
  const toast = document.getElementById("toast");
  toast.innerHTML = `🗑️ Tarea eliminada. <span class="undo" id="btnDeshacer">Deshacer</span>`;
  toast.classList.add("show");
  clearTimeout(deshacerTimer);
  document.getElementById("btnDeshacer").addEventListener("click", () => {
    if (ultimaEliminada) {
      tareas.splice(ultimaEliminada.idx, 0, ultimaEliminada.tarea);
      ultimaEliminada = null;
      guardar();
      render();
    }
    toast.classList.remove("show");
  });
  deshacerTimer = setTimeout(() => {
    toast.classList.remove("show");
    ultimaEliminada = null;
  }, 5000);
}

document.getElementById("btnAgregar").addEventListener("click", agregar);
document.getElementById("entrada").addEventListener("keydown", (e) => {
  if (e.key === "Enter") agregar();
});
async function agregar() {
  const val = document.getElementById("entrada").value.trim();
  if (!val) return;
  let interpretadas = null;
  if (modoServidor) {
    try {
      interpretadas = (
        await api("/interpretar", {
          method: "POST",
          body: JSON.stringify({ texto: val }),
        })
      ).tareas;
    } catch (e) {
      interpretadas = null;
    }
  }
  if (!interpretadas)
    interpretadas = dividirTareas(val).map((p) => interpretar(p));
  const creadas = interpretadas.map((r) => {
    tareas.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2),
      ...r,
      hecha: false,
    });
    return r;
  });
  guardar();
  const toast = document.getElementById("toast");
  if (creadas.length === 1) {
    const r = creadas[0];
    toast.textContent = `🤖 detecté: ${r.tipo}${r.materia ? " de " + r.materia : ""} · vence ${r.fecha} · prioridad ${r.prioridad}`;
  } else {
    toast.textContent = `🤖 detecté ${creadas.length} tareas en un solo mensaje: ${creadas.map((r) => r.tipo + (r.materia ? " de " + r.materia : "")).join(" · ")}`;
  }
  mostrarToast(4000);
  document.getElementById("entrada").value = "";
  render();
}

function preguntar(texto) {
  const val = (
    texto !== undefined ? texto : document.getElementById("pregunta").value
  ).trim();
  if (!val) return;
  chatLog.push({ who: "user", text: val });
  document.getElementById("pregunta").value = "";
  responder(val);
}
async function responder(val) {
  let texto = null;
  if (modoServidor) {
    try {
      texto = (
        await api("/asistente", {
          method: "POST",
          body: JSON.stringify({ pregunta: val }),
        })
      ).respuesta;
    } catch (e) {
      texto = null;
    }
  }
  chatLog.push({ who: "bot", text: texto || respuestaAsistente(val) });
  guardarChat();
  renderChat();
}
document
  .getElementById("btnPreguntar")
  .addEventListener("click", () => preguntar());
document.getElementById("pregunta").addEventListener("keydown", (e) => {
  if (e.key === "Enter") preguntar();
});
document
  .querySelectorAll(".chip")
  .forEach((c) => c.addEventListener("click", () => preguntar(c.dataset.q)));

document.querySelectorAll(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".tabs button")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    filtro = b.dataset.f;
    render();
  }),
);

// ---- Formulario manual (alternativa confiable a la interpretación por texto) ----
document.getElementById("toggleManual").addEventListener("click", () => {
  document.getElementById("manualForm").classList.toggle("show");
});
document.getElementById("mf-guardar").addEventListener("click", () => {
  const nombre = document.getElementById("mf-nombre").value.trim();
  const fecha = document.getElementById("mf-fecha").value;
  if (!nombre || !fecha) {
    const toast = document.getElementById("toast");
    toast.textContent = "Escribe al menos el nombre y la fecha de entrega.";
    mostrarToast(3000);
    return;
  }
  tareas.push({
    id: Date.now() + "-" + Math.random().toString(36).slice(2),
    nombre,
    fecha,
    materia: document.getElementById("mf-materia").value.trim(),
    tipo: document.getElementById("mf-tipo").value,
    prioridad: document.getElementById("mf-prioridad").value,
    peso: Math.min(
      100,
      Math.max(0, parseInt(document.getElementById("mf-peso").value) || 0),
    ),
    hecha: false,
  });
  guardar();
  ["mf-nombre", "mf-materia", "mf-fecha", "mf-peso"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  render();
});

// ---- Exportar / Importar (respaldo manual, ya que los datos solo viven en este navegador) ----
document.getElementById("btnExportar").addEventListener("click", async () => {
  const data = JSON.stringify(tareas, null, 2);
  const toast = document.getElementById("toast");
  try {
    await navigator.clipboard.writeText(data);
    toast.textContent =
      "📋 Copia de seguridad copiada — guárdala en un archivo de texto.";
  } catch (e) {
    toast.textContent =
      "No se pudo copiar automáticamente. Selecciona el texto manualmente.";
  }
  mostrarToast(4000);
});
document.getElementById("btnImportar").addEventListener("click", () => {
  const raw = document.getElementById("importText").value.trim();
  const toast = document.getElementById("toast");
  if (!raw) {
    return;
  }
  try {
    const datos = JSON.parse(raw);
    if (!Array.isArray(datos)) throw new Error("formato inválido");
    const idsActuales = new Set(tareas.map((t) => t.id));
    let agregadas = 0;
    datos.forEach((t) => {
      if (t && t.nombre && t.fecha && !idsActuales.has(t.id)) {
        tareas.push({
          id: t.id || Date.now() + "-" + Math.random().toString(36).slice(2),
          nombre: t.nombre,
          materia: t.materia || "",
          tipo: t.tipo || "Tarea",
          prioridad: t.prioridad || "normal",
          peso: t.peso || 0,
          fecha: t.fecha,
          hecha: !!t.hecha,
        });
        agregadas++;
      }
    });
    guardar();
    document.getElementById("importText").value = "";
    toast.textContent = `✅ Se importaron ${agregadas} tarea(s).`;
    render();
  } catch (e) {
    toast.textContent =
      "El texto pegado no es una copia de seguridad válida de OEFO.";
  }
  mostrarToast(4000);
});
