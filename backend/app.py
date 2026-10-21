"""Capa de SISTEMA de OEFO: API REST + entrega del frontend."""
import os
import re
import uuid
from datetime import date

from flask import Flask, jsonify, request, send_from_directory

from . import logic
from .db import Db

TIPOS = {"Tarea", "Trabajo", "Examen"}
PRIORIDADES = {"normal", "alta"}
FRONTEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")


def limpiar(d):
    """Valida y normaliza una tarea. Lanza ValueError con un mensaje legible."""
    nombre = str(d.get("nombre") or "").strip()
    if not nombre:
        raise ValueError("El nombre es obligatorio")
    fecha = str(d.get("fecha") or "")
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fecha):
            raise ValueError
        date.fromisoformat(fecha)
    except ValueError:
        raise ValueError("La fecha debe ser válida y con formato AAAA-MM-DD")
    tipo, prioridad = d.get("tipo") or "Tarea", d.get("prioridad") or "normal"
    if tipo not in TIPOS:
        raise ValueError("Tipo inválido (Tarea, Trabajo o Examen)")
    if prioridad not in PRIORIDADES:
        raise ValueError("Prioridad inválida (normal o alta)")
    try:
        peso = int(d.get("peso") or 0)
    except (TypeError, ValueError):
        raise ValueError("El peso debe ser un número")
    if not 0 <= peso <= 100:
        raise ValueError("El peso debe estar entre 0 y 100")
    return {"id": str(d.get("id") or uuid.uuid4().hex), "nombre": nombre[:200],
            "materia": str(d.get("materia") or "").strip()[:80], "tipo": tipo,
            "prioridad": prioridad, "peso": peso, "fecha": fecha, "hecha": bool(d.get("hecha"))}


def create_app(db_path=None):
    app = Flask(__name__, static_folder=None)
    app.json.ensure_ascii = False
    db = Db(db_path or os.environ.get("OEFO_DB", "oefo.db"))

    def cuerpo():
        return request.get_json(silent=True) or {}

    @app.errorhandler(ValueError)
    def _valor(e):
        return jsonify(error=str(e)), 400

    @app.get("/")
    def raiz():
        return send_from_directory(FRONTEND, "index.html")

    @app.get("/css/<path:ruta>")
    def estilos(ruta):
        return send_from_directory(os.path.join(FRONTEND, "css"), ruta)

    @app.get("/js/<path:ruta>")
    def scripts(ruta):
        return send_from_directory(os.path.join(FRONTEND, "js"), ruta)

    @app.get("/api/health")
    def health():
        return jsonify(ok=True)

    @app.get("/api/tareas")
    def listar():
        return jsonify(tareas=db.listar())

    @app.post("/api/tareas")
    def crear():
        b = cuerpo()
        items = logic.interpretar_varias(b["texto"]) if "texto" in b else [b]
        creadas = [limpiar(i) for i in items]
        for t in creadas:
            db.guardar(t)
        return jsonify(tareas=creadas), 201

    @app.put("/api/tareas/<id>")
    def actualizar(id):
        actual = db.obtener(id)
        if not actual:
            return jsonify(error="Tarea no encontrada"), 404
        t = limpiar({**actual, **cuerpo(), "id": id})
        db.guardar(t)
        return jsonify(t)

    @app.delete("/api/tareas/<id>")
    def borrar(id):
        if not db.eliminar(id):
            return jsonify(error="Tarea no encontrada"), 404
        return "", 204

    @app.post("/api/sync")
    def sync():
        lista = cuerpo().get("tareas")
        if not isinstance(lista, list) or len(lista) > 2000:
            raise ValueError("Se esperaba una lista de tareas (máx. 2000)")
        db.reemplazar([limpiar(t) for t in lista])
        return jsonify(tareas=db.listar())

    @app.post("/api/interpretar")
    def interpretar():
        return jsonify(tareas=logic.interpretar_varias(cuerpo().get("texto", "")))

    @app.get("/api/resumen")
    def resumen():
        return jsonify(logic.resumen(db.listar()))

    @app.post("/api/asistente")
    def asistente():
        pregunta = str(cuerpo().get("pregunta") or "").strip()
        if not pregunta:
            raise ValueError("Escribe una pregunta")
        return jsonify(respuesta=logic.respuesta_asistente(pregunta, db.listar()))

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)))
