from datetime import date

import pytest

from backend import logic

HOY = date(2026, 10, 12)  # lunes


@pytest.mark.parametrize("texto,materia", [
    ("examen de cálculo el viernes, urgente", "Cálculo"),        # antes: "CáLculo"
    ("trabajo de historia el lunes", "Historia"),                  # antes: "Historia El"
    ("laboratorio de química el miércoles", "Química"),            # antes: "Química El"
    ("entrega de proyecto de física el jueves", "Proyecto Física"),  # antes: "Proyecto De"
    ("examen de inglés mañana", "Inglés"),                         # antes: "InglÉS"
])
def test_materia_sin_basura_ni_tildes_rotas(texto, materia):
    assert logic.interpretar(texto, HOY)["materia"] == materia


@pytest.mark.parametrize("texto,esperada", [
    ("examen de cálculo el viernes", "2026-10-16"),
    ("trabajo de historia el lunes", "2026-10-19"),  # hoy es lunes -> el próximo
    ("examen de inglés mañana", "2026-10-13"),
    ("tarea de física pasado mañana", "2026-10-14"),
    ("tarea de física en 5 días", "2026-10-17"),
    ("tarea de física hoy", "2026-10-12"),
    ("recordar comprar cuadernos", "2026-10-15"),    # sin fecha: +3 días
])
def test_fechas(texto, esperada):
    assert logic.interpretar(texto, HOY)["fecha"] == esperada


def test_tipo_prioridad_y_peso():
    t = logic.interpretar("examen de cálculo el viernes, vale 30%, urgente", HOY)
    assert (t["tipo"], t["prioridad"], t["peso"]) == ("Examen", "alta", 30)


def test_peso_se_limita_a_100():
    assert logic.interpretar("quiz de física vale 250%", HOY)["peso"] == 100


def test_varias_tareas_en_un_mensaje():
    ts = logic.interpretar_varias("trabajo de literatura y examen de física el viernes", HOY)
    assert [(t["tipo"], t["materia"]) for t in ts] == [("Trabajo", "Literatura"), ("Examen", "Física")]
    assert ts[1]["fecha"] == "2026-10-16"


def test_texto_vacio_es_error():
    with pytest.raises(ValueError):
        logic.interpretar_varias("   ")


def tarea(**kw):
    base = {"nombre": "x", "tipo": "Tarea", "prioridad": "normal", "fecha": "2026-10-30", "hecha": False}
    return {**base, **kw}


def test_riesgo_niveles():
    assert logic.riesgo_tarea(tarea(tipo="Examen", prioridad="alta", fecha="2026-10-12"), HOY) == ("critico", 7)
    assert logic.riesgo_tarea(tarea(), HOY) == ("bajo", 1)
    assert logic.riesgo_tarea(tarea(fecha="2026-10-10"), HOY)[0] == "alto"   # atrasada
    assert logic.riesgo_tarea(tarea(hecha=True, tipo="Examen"), HOY) == ("bajo", 0)


def test_riesgo_global():
    assert logic.riesgo_global([], HOY) == 4
    assert logic.riesgo_global([tarea(tipo="Examen", prioridad="alta", fecha="2026-10-12")], HOY) == 100


def test_por_materia_suma_riesgo_y_peso():
    ts = [tarea(materia="Cálculo", tipo="Examen", fecha="2026-10-13", peso=30),
          tarea(materia="Cálculo", fecha="2026-10-13", peso=10),
          tarea(materia="Inglés")]
    m = logic.por_materia(ts, HOY)
    assert m[0]["materia"] == "Cálculo" and m[0]["peso"] == 40


def test_resumen_cuenta_atrasadas():
    r = logic.resumen([tarea(fecha="2026-10-01"), tarea(hecha=True)], HOY)
    assert (r["pendientes"], r["atrasadas"]) == (1, 1)


def test_asistente_recomienda_la_de_mayor_riesgo():
    ts = [tarea(nombre="Leer", fecha="2026-12-01"),
          tarea(nombre="Examen de cálculo", tipo="Examen", fecha="2026-10-13", materia="Cálculo")]
    assert "Examen de cálculo" in logic.respuesta_asistente("¿qué me recomiendas hacer?", ts, HOY)


def test_asistente_sin_tareas_no_falla():
    for q in ["¿qué tengo pendiente?", "¿cómo voy esta semana?", "materia más riesgosa", "hola"]:
        assert logic.respuesta_asistente(q, [], HOY)


def test_un_modificador_no_crea_tarea_fantasma():
    # Bug real visto en las evidencias: "urgente" quedaba como una tarea aparte
    ts = logic.interpretar_varias("examen de cálculo el viernes, urgente", HOY)
    assert len(ts) == 1 and ts[0]["prioridad"] == "alta"
    ts = logic.interpretar_varias("examen de cálculo el viernes, vale 30%, urgente", HOY)
    assert len(ts) == 1 and (ts[0]["peso"], ts[0]["prioridad"]) == (30, "alta")


def test_tareas_separadas_por_coma_siguen_separandose():
    assert len(logic.interpretar_varias("examen de física, tarea de química", HOY)) == 2
