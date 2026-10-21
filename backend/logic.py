"""Capa de INTELIGENCIA y REGLAS de OEFO.

Funciones puras: no conocen Flask ni la base de datos, por eso se pueden probar solas.
Inteligencia (interpretar, riesgo, asistente) = heurísticas basadas en reglas, no un modelo entrenado.
"""
import re
from datetime import date, timedelta

DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
STOP = {"el", "la", "los", "las", "de", "del", "al", "un", "una", "hoy", "mañana", "pasado",
        *DIAS, "urgente", "importante", "alta", "normal", "prioridad"}
SEPARADOR = re.compile(
    r",| y (?=examen|parcial|quiz|sustentaci|trabajo|ensayo|proyecto|informe|tarea)", re.I)


MODIF = STOP | {"vale", "pesa", "en", "días", "dias", "día", "dia", "nota", "muy",
                "con", "para", "es", "y", "que", "por"}


def _solo_modificadores(fragmento):
    """True si el fragmento solo trae prioridad/fecha/peso (ej. 'urgente', 'vale 30%')."""
    toks = re.findall(r"[a-záéíóúñ]+|\d+%?", fragmento.lower())
    return bool(toks) and all(t in MODIF or t[0].isdigit() for t in toks)


def dividir(texto):
    """Separa varias tareas en un mensaje, sin convertir un modificador en tarea nueva."""
    partes = [p.strip() for p in SEPARADOR.split(texto) if p and p.strip()]
    salida = []
    for p in partes:
        if salida and _solo_modificadores(p):
            salida[-1] += ", " + p
        else:
            salida.append(p)
    return salida or [texto.strip()]


def _fecha(t, hoy):
    if "hoy" in t:
        return hoy
    if "pasado mañana" in t:
        return hoy + timedelta(days=2)
    if "mañana" in t:
        return hoy + timedelta(days=1)
    m = re.search(r"en (\d+) d[ií]as", t)
    if m:
        return hoy + timedelta(days=int(m.group(1)))
    hoy_idx = (hoy.weekday() + 1) % 7  # domingo = 0, como en DIAS
    for i, d in enumerate(DIAS):
        if d in t:
            return hoy + timedelta(days=((i - hoy_idx) % 7) or 7)
    return hoy + timedelta(days=3)


def interpretar(texto, hoy=None):
    """Texto libre -> tarea estructurada (clasifica tipo, materia, prioridad, peso y fecha)."""
    hoy = hoy or date.today()
    texto = texto.strip()
    t = texto.lower()
    prioridad = "alta" if re.search(r"urgent|important|alta|crític", t) else "normal"
    if re.search(r"examen|parcial|quiz|sustentaci", t):
        tipo = "Examen"
    elif re.search(r"trabajo|ensayo|proyecto|informe", t):
        tipo = "Trabajo"
    else:
        tipo = "Tarea"
    materia = ""
    m = re.search(r"\bde ([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+){0,2})", t)
    if m:
        palabras = [w for w in m.group(1).split() if w not in STOP]
        materia = " ".join(w.capitalize() for w in palabras[:2])
    p = re.search(r"(\d{1,3})\s?%", t)
    peso = min(100, int(p.group(1))) if p else 0
    return {"nombre": texto[:1].upper() + texto[1:], "materia": materia, "tipo": tipo,
            "prioridad": prioridad, "peso": peso, "fecha": _fecha(t, hoy).isoformat()}


def interpretar_varias(texto, hoy=None):
    if not texto or not texto.strip():
        raise ValueError("Escribe el texto de la tarea")
    return [interpretar(p, hoy) for p in dividir(texto)]


def riesgo_tarea(t, hoy=None):
    """Devuelve (nivel, puntos). Reglas: tipo + prioridad + cercanía de la fecha."""
    if t.get("hecha"):
        return "bajo", 0
    hoy = hoy or date.today()
    d = (date.fromisoformat(t["fecha"]) - hoy).days
    p = {"Examen": 3, "Trabajo": 2}.get(t.get("tipo"), 1) + (1 if t.get("prioridad") == "alta" else 0)
    p += 4 if d < 0 else 3 if d == 0 else 2 if d <= 1 else 1 if d <= 3 else 0
    nivel = "critico" if p >= 6 else "alto" if p >= 4 else "medio" if p >= 2 else "bajo"
    return nivel, p


def _pendientes(tareas):
    return [t for t in tareas if not t.get("hecha")]


def riesgo_global(tareas, hoy=None):
    pend = _pendientes(tareas)
    if not pend:
        return 4
    total = sum(riesgo_tarea(t, hoy)[1] for t in pend)
    return min(100, int(total / (len(pend) * 7) * 100 + 0.5))


def por_materia(tareas, hoy=None):
    acc = {}
    for t in _pendientes(tareas):
        if t.get("materia"):
            m = acc.setdefault(t["materia"], {"materia": t["materia"], "puntos": 0, "peso": 0})
            m["puntos"] += riesgo_tarea(t, hoy)[1]
            m["peso"] += t.get("peso") or 0
    return sorted(acc.values(), key=lambda m: -m["puntos"])


def resumen(tareas, hoy=None):
    hoy = hoy or date.today()
    pend = _pendientes(tareas)
    return {"pendientes": len(pend),
            "atrasadas": sum(1 for t in pend if date.fromisoformat(t["fecha"]) < hoy),
            "riesgo_global": riesgo_global(tareas, hoy),
            "materias": por_materia(tareas, hoy)}


def respuesta_asistente(pregunta, tareas, hoy=None):
    hoy = hoy or date.today()
    t = pregunta.lower()
    pend = sorted(_pendientes(tareas), key=lambda x: -riesgo_tarea(x, hoy)[1])
    if re.search(r"materia.*riesg|riesgo.*materia", t):
        mats = por_materia(tareas, hoy)
        if not mats:
            return "Aún no tengo materias suficientes para comparar el riesgo entre ellas."
        return (f"La materia con más riesgo acumulado ahora es {mats[0]['materia']}, "
                f"con {mats[0]['puntos']} puntos de riesgo pendiente.")
    if re.search(r"cómo voy|como voy|resumen|semana", t):
        r = riesgo_global(tareas, hoy)
        cola = ("La semana está apretada, prioriza hoy mismo." if r >= 60 else
                "Vas estable, pero hay entregas cerca — no las dejes para el final." if r >= 30 else
                "Vas tranquilo por ahora.")
        return f"Tu riesgo académico global está en {r}/100. {cola}"
    if re.search(r"recomienda|qué hago|que hago|prioridad|ahora", t):
        if not pend:
            return "No tienes tareas pendientes — buen momento para adelantar lecturas o descansar."
        top = pend[0]
        mat = f" ({top['materia']})" if top.get("materia") else ""
        return f'Te recomiendo empezar por "{top["nombre"]}"{mat} — es la de mayor riesgo en este momento.'
    if re.search(r"pendiente|tengo", t):
        if not pend:
            return "No tienes tareas pendientes registradas. ¡Vas al día!"
        hoy_t = [x for x in pend if date.fromisoformat(x["fecha"]) <= hoy]
        if hoy_t:
            return f"Para hoy tienes: {', '.join(x['nombre'] for x in hoy_t)}. En total llevas {len(pend)} pendiente(s)."
        return f'Tienes {len(pend)} tarea(s) pendiente(s). La más urgente es "{pend[0]["nombre"]}".'
    return ("Puedo responder cosas como “¿qué tengo pendiente?”, “¿cuál es mi materia más riesgosa?”, "
            "“¿cómo voy esta semana?” o “qué me recomiendas hacer?”")
