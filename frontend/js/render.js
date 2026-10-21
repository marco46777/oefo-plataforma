/**
 * VISTA: pinta en pantalla el medidor, resumen, semana, materias, logros, chat, mapa del mes y lista de tareas.
 */

function renderGauge(v) {
  const c = 201,
    off = c - (c * v) / 100;
  document.getElementById("gaugeArc").setAttribute("stroke-dashoffset", off);
  document.getElementById("gaugeArc").style.stroke =
    v >= 60 ? "var(--risk)" : v >= 30 ? "var(--warn)" : "var(--ok)";
  document.getElementById("gaugeVal").textContent = v;
}

function renderResumenDia() {
  const dia = DIAS[new Date().getDay()];
  const pend = pendientesOrdenadas();
  const r = riesgoGlobal();
  const urgentesHoy = pend.filter((x) => diasRestantes(x.fecha) <= 0).length;
  let msg = `Hoy es ${dia}. Tu riesgo académico está en <strong>${r}/100</strong>`;
  msg +=
    urgentesHoy > 0
      ? `, con <strong>${urgentesHoy}</strong> entrega(s) urgente(s) hoy.`
      : ".";
  if (pend.length > 0)
    msg += ` Te sugiero empezar por "<strong>${esc(pend[0].nombre)}</strong>"${pend[0].materia ? ` (${esc(pend[0].materia)})` : ""}.`;
  else
    msg +=
      " No tienes pendientes registrados — buen momento para planear la próxima semana.";
  document.getElementById("resumenDia").innerHTML = "🤖 " + msg;
}

function renderWeek() {
  const el = document.getElementById("week");
  el.innerHTML = "";
  const pend = pendientesOrdenadas()
    .slice()
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  for (let i = 0; i < 7; i++) {
    const d = hoy0();
    d.setDate(d.getDate() + i);
    const dStr = iso(d);
    const entrega = pend.find((t) => t.fecha === dStr);
    const repaso =
      !entrega &&
      pend.find((t) => {
        const r = diasRestantes(t.fecha);
        return r === i + 1 || (r > 0 && r <= 2 && i === 0);
      });
    const div = document.createElement("div");
    div.className =
      "day" +
      (i === 0 ? " hoy" : "") +
      (entrega ? " entrega" : repaso ? " repaso" : " libre");
    div.innerHTML = `<div class="d">${DIAS_ABR[d.getDay()]}</div><div class="f">${entrega ? "🎯 " + esc(entrega.materia || entrega.nombre) : repaso ? "📖 " + esc(repaso.materia || repaso.nombre) : "Libre"}</div>`;
    el.appendChild(div);
  }
}

function renderMaterias() {
  const el = document.getElementById("materias");
  el.innerHTML = "";
  const agg = riesgoPorMateria();
  if (agg.length === 0) {
    el.innerHTML = `<p class="empty empty-left">Agrega materias en tus tareas para ver aquí su nivel de riesgo.</p>`;
    return;
  }
  const pesos = pesoPorMateria();
  const max = Math.max(...agg.map((a) => a.puntos), 1);
  agg.slice(0, 6).forEach((a) => {
    const row = document.createElement("div");
    row.className = "materia-row";
    const pesoTxt = pesos[a.materia]
      ? ` · ${pesos[a.materia]}% de la nota en juego`
      : "";
    row.innerHTML = `<div class="nom">${esc(a.materia)}</div><div class="track"><div class="fill" style="width:${Math.round((a.puntos / max) * 100)}%"></div></div><div style="font-size:.68rem;color:var(--text-soft);flex:0 0 auto">${pesoTxt}</div>`;
    el.appendChild(row);
  });
}

function renderLogros() {
  const el = document.getElementById("logros");
  el.innerHTML = "";
  const racha = actualizarRacha();
  const atrasadas = tareas.filter(
    (t) => !t.hecha && diasRestantes(t.fecha) < 0,
  ).length;
  const completadas = tareas.filter((t) => t.hecha).length;
  const pend = tareas.filter((t) => !t.hecha).length;
  const items = [
    {
      ic: "🔥",
      t: "Racha activa",
      d: `${racha} día(s) seguidos`,
      on: racha >= 2,
    },
    {
      ic: "🎯",
      t: "Cero atrasos",
      d: "nada vencido",
      on: atrasadas === 0 && pend > 0,
    },
    {
      ic: "✅",
      t: "Constancia",
      d: "5+ tareas completadas",
      on: completadas >= 5,
    },
  ];
  items.forEach((it) => {
    const d = document.createElement("div");
    d.className = "logro" + (it.on ? " on" : "");
    d.innerHTML = `<span class="ic">${it.ic}</span><div>${it.t}</div><div style="color:var(--text-soft)">${it.d}</div>`;
    el.appendChild(d);
  });
}

function renderChat() {
  const el = document.getElementById("chat");
  el.innerHTML = "";
  chatLog.forEach((m) => {
    const div = document.createElement("div");
    div.className = "msg " + m.who;
    div.textContent = m.text;
    el.appendChild(div);
  });
  el.scrollTop = el.scrollHeight;
}

let pendPrevias = null;
function render() {
  renderGauge(riesgoGlobal());
  const pendAhora = tareas.filter((t) => !t.hecha).length;
  document.getElementById("stPend").textContent = pendAhora;
  document.getElementById("stAtras").textContent = tareas.filter(
    (t) => !t.hecha && diasRestantes(t.fecha) < 0,
  ).length;
  document.getElementById("stRacha").textContent = actualizarRacha();
  renderResumenDia();
  renderWeek();
  renderMaterias();
  renderLogros();
  renderChat();
  renderMonth();
  refreshFocusTask();
  actualizarDatalist();
  if (pendPrevias !== null && pendPrevias > 0 && pendAhora === 0)
    lanzarConfeti();
  pendPrevias = pendAhora;

  const ul = document.getElementById("lista");
  ul.innerHTML = "";
  let vista = tareas.filter((t) =>
    filtro === "pendientes"
      ? !t.hecha
      : filtro === "completadas"
        ? t.hecha
        : true,
  );
  vista.sort((a, b) => {
    if (a.hecha !== b.hecha) return a.hecha ? 1 : -1;
    return riesgoTarea(b).puntos - riesgoTarea(a).puntos;
  });
  if (vista.length === 0) {
    ul.innerHTML = `<li class="empty empty-list">Nada aquí todavía.</li>`;
  }
  vista.forEach((t) => {
    const li = document.createElement("li");
    if (soloLectura) {
      const r = riesgoTarea(t);
      const d = diasRestantes(t.fecha);
      const cuando =
        d < 0
          ? `Atrasada ${Math.abs(d)}d`
          : d === 0
            ? "Vence hoy"
            : d === 1
              ? "Vence mañana"
              : `En ${d} días`;
      li.className = t.hecha
        ? "hecha"
        : r.nivel === "critico"
          ? "riesgo-critico"
          : r.nivel === "alto"
            ? "riesgo-alto"
            : "";
      li.innerHTML = `
        <div class="info">
          <div class="nombre">${esc(t.nombre)}${t.hecha ? " ✅" : ""}</div>
          <div class="meta">${t.materia ? esc(t.materia) + " · " : ""}${esc(t.tipo)} · ${cuando}${t.peso ? ` · vale ${esc(String(t.peso))}%` : ""}${!t.hecha ? ` <span class="badge ${r.nivel === "critico" ? "critico" : r.nivel === "alto" ? "alto" : r.nivel === "medio" ? "medio" : "bajo"}">${r.nivel}</span>` : ""}</div>
        </div>
        <a class="icon-btn" href="${enlaceGoogleCalendar(t)}" target="_blank" rel="noopener" title="Agregar a mi Google Calendar">📅</a>`;
      ul.appendChild(li);
      return;
    }
    if (editandoId === t.id) {
      li.className = "";
      li.innerHTML = `
        <div class="edit-form">
          <div class="mf-row">
            <input class="e-nombre" type="text" value="${escAttr(t.nombre)}">
          </div>
          <div class="mf-row">
            <input class="e-materia" type="text" list="mf-materias" value="${escAttr(t.materia || "")}" placeholder="Materia">
            <select class="e-tipo">
              <option ${t.tipo === "Tarea" ? "selected" : ""}>Tarea</option>
              <option ${t.tipo === "Trabajo" ? "selected" : ""}>Trabajo</option>
              <option ${t.tipo === "Examen" ? "selected" : ""}>Examen</option>
            </select>
          </div>
          <div class="mf-row">
            <input class="e-fecha" type="date" value="${escAttr(t.fecha)}">
            <select class="e-prioridad">
              <option value="normal" ${t.prioridad === "normal" ? "selected" : ""}>Normal</option>
              <option value="alta" ${t.prioridad === "alta" ? "selected" : ""}>Alta</option>
            </select>
            <input class="e-peso" type="number" min="0" max="100" placeholder="% nota" value="${escAttr(String(t.peso || ""))}">
          </div>
          <div class="edit-actions">
            <button class="save">Guardar</button>
            <button class="cancel">Cancelar</button>
          </div>
        </div>`;
      li.querySelector(".save").addEventListener("click", () => {
        t.nombre = li.querySelector(".e-nombre").value.trim() || t.nombre;
        t.materia = li.querySelector(".e-materia").value.trim();
        t.tipo = li.querySelector(".e-tipo").value;
        t.fecha = li.querySelector(".e-fecha").value || t.fecha;
        t.prioridad = li.querySelector(".e-prioridad").value;
        t.peso = Math.min(
          100,
          Math.max(0, parseInt(li.querySelector(".e-peso").value) || 0),
        );
        editandoId = null;
        guardar();
        render();
      });
      li.querySelector(".cancel").addEventListener("click", () => {
        editandoId = null;
        render();
      });
      ul.appendChild(li);
      return;
    }
    const r = riesgoTarea(t);
    li.className = t.hecha
      ? "hecha"
      : r.nivel === "critico"
        ? "riesgo-critico"
        : r.nivel === "alto"
          ? "riesgo-alto"
          : "";
    const d = diasRestantes(t.fecha);
    const cuando =
      d < 0
        ? `Atrasada ${Math.abs(d)}d`
        : d === 0
          ? "Vence hoy"
          : d === 1
            ? "Vence mañana"
            : `En ${d} días`;
    li.innerHTML = `
      <input type="checkbox" ${t.hecha ? "checked" : ""}>
      <div class="info">
        <div class="nombre">${esc(t.nombre)}</div>
        <div class="meta">${t.materia ? esc(t.materia) + " · " : ""}${esc(t.tipo)} · ${cuando}${t.peso ? ` · vale ${esc(String(t.peso))}%` : ""}${!t.hecha ? ` <span class="badge ${r.nivel === "critico" ? "critico" : r.nivel === "alto" ? "alto" : r.nivel === "medio" ? "medio" : "bajo"}">${r.nivel}</span>` : ""}</div>
      </div>
      <a class="icon-btn cal" href="${enlaceGoogleCalendar(t)}" target="_blank" rel="noopener" title="Agregar a Google Calendar" aria-label="Agregar a Google Calendar">📅</a>
      <button class="icon-btn edit" title="Editar" aria-label="Editar tarea">✎</button>
      <button class="del icon-btn" title="Eliminar" aria-label="Eliminar tarea">✕</button>`;
    li.querySelector("input").addEventListener("change", () => {
      t.hecha = !t.hecha;
      guardar();
      render();
    });
    li.querySelector(".edit").addEventListener("click", () => {
      editandoId = t.id;
      render();
    });
    li.querySelector(".del").addEventListener("click", () => {
      eliminarConDeshacer(t.id);
    });
    ul.appendChild(li);
  });
}

// ---- Mapa de carga del mes ----
function renderMonth() {
  const el = document.getElementById("monthGrid");
  el.innerHTML = "";
  const hoy = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const dias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const offset = primero.getDay();
  const cargaPorDia = {};
  tareas
    .filter((t) => !t.hecha)
    .forEach((t) => {
      const f = t.fecha;
      cargaPorDia[f] = (cargaPorDia[f] || 0) + riesgoTarea(t).puntos;
    });
  const max = Math.max(...Object.values(cargaPorDia), 1);
  for (let i = 0; i < offset; i++) {
    const b = document.createElement("div");
    b.className = "month-cell blank";
    el.appendChild(b);
  }
  for (let d = 1; d <= dias; d++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), d);
    const fStr = iso(fecha);
    const carga = cargaPorDia[fStr] || 0;
    const cell = document.createElement("div");
    cell.className = "month-cell" + (fStr === iso(hoy0()) ? " hoy" : "");
    if (carga > 0) {
      const ratio = carga / max;
      cell.style.background =
        ratio > 0.6
          ? "var(--risk-bg)"
          : ratio > 0.25
            ? "var(--warn-bg)"
            : "var(--accent-soft)";
      cell.style.borderColor =
        ratio > 0.6
          ? "var(--risk)"
          : ratio > 0.25
            ? "var(--warn)"
            : "var(--accent)";
    }
    cell.textContent = d;
    el.appendChild(cell);
  }
}

// ---- Materias conocidas (datalist) ----
function actualizarDatalist() {
  const set = [...new Set(tareas.map((t) => t.materia).filter(Boolean))];
  document.getElementById("mf-materias").innerHTML = set
    .map((m) => `<option value="${escAttr(m)}">`)
    .join("");
}
