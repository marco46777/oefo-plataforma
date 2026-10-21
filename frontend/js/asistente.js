/**
 * INTELIGENCIA (3/3): respuestas del asistente conversacional "Pregúntale a OEFO".
 */

function respuestaAsistente(q) {
  const t = q.toLowerCase();
  const pend = pendientesOrdenadas();
  if (/materia.*riesg|riesgo.*materia/.test(t)) {
    const agg = riesgoPorMateria();
    if (agg.length === 0)
      return "Aún no tengo materias suficientes para comparar el riesgo entre ellas.";
    return `La materia con más riesgo acumulado ahora es ${agg[0].materia}, con ${agg[0].puntos} puntos de riesgo pendiente.`;
  }
  if (/cómo voy|como voy|resumen|semana/.test(t)) {
    const r = riesgoGlobal();
    return `Tu riesgo académico global está en ${r}/100. ${r >= 60 ? "La semana está apretada, prioriza hoy mismo." : r >= 30 ? "Vas estable, pero hay entregas cerca — no las dejes para el final." : "Vas tranquilo por ahora."}`;
  }
  if (/recomienda|qué hago|que hago|prioridad|ahora/.test(t)) {
    if (pend.length === 0)
      return "No tienes tareas pendientes — buen momento para adelantar lecturas o descansar.";
    const top = pend[0];
    return `Te recomiendo empezar por "${top.nombre}"${top.materia ? ` (${top.materia})` : ""} — es la de mayor riesgo en este momento.`;
  }
  if (/pendiente|tengo/.test(t)) {
    if (pend.length === 0)
      return "No tienes tareas pendientes registradas. ¡Vas al día!";
    const hoyT = pend.filter((x) => diasRestantes(x.fecha) <= 0);
    if (hoyT.length > 0)
      return `Para hoy tienes: ${hoyT.map((x) => x.nombre).join(", ")}. En total llevas ${pend.length} pendiente(s).`;
    return `Tienes ${pend.length} tarea(s) pendiente(s). La más urgente es "${pend[0].nombre}".`;
  }
  return "Puedo responder cosas como \u201C¿qué tengo pendiente?\u201D, \u201C¿cuál es mi materia más riesgosa?\u201D, \u201C¿cómo voy esta semana?\u201D o \u201Cqué me recomiendas hacer?\u201D";
}
