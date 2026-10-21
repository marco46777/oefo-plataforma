"""Capa de DATOS de OEFO: persistencia en SQLite (un solo archivo, sin servidor aparte)."""
import sqlite3
from contextlib import closing

ESQUEMA = """CREATE TABLE IF NOT EXISTS tareas(
    id TEXT PRIMARY KEY, nombre TEXT NOT NULL, materia TEXT DEFAULT '',
    tipo TEXT NOT NULL, prioridad TEXT NOT NULL, peso INTEGER DEFAULT 0,
    fecha TEXT NOT NULL, hecha INTEGER DEFAULT 0)"""
UPSERT = """INSERT INTO tareas(id,nombre,materia,tipo,prioridad,peso,fecha,hecha)
    VALUES(:id,:nombre,:materia,:tipo,:prioridad,:peso,:fecha,:hecha)
    ON CONFLICT(id) DO UPDATE SET nombre=:nombre, materia=:materia, tipo=:tipo,
    prioridad=:prioridad, peso=:peso, fecha=:fecha, hecha=:hecha"""


class Db:
    def __init__(self, ruta):
        self.ruta = ruta
        with closing(self._con()) as c, c:
            c.execute(ESQUEMA)

    def _con(self):
        c = sqlite3.connect(self.ruta)
        c.row_factory = sqlite3.Row
        return c

    @staticmethod
    def _fila(r):
        d = dict(r)
        d["hecha"] = bool(d["hecha"])
        return d

    def listar(self):
        with closing(self._con()) as c:
            return [self._fila(r) for r in c.execute("SELECT * FROM tareas ORDER BY fecha, rowid")]

    def obtener(self, id):
        with closing(self._con()) as c:
            r = c.execute("SELECT * FROM tareas WHERE id=?", (id,)).fetchone()
            return self._fila(r) if r else None

    def guardar(self, t):
        with closing(self._con()) as c, c:
            c.execute(UPSERT, {**t, "hecha": int(t["hecha"])})

    def eliminar(self, id):
        with closing(self._con()) as c, c:
            return c.execute("DELETE FROM tareas WHERE id=?", (id,)).rowcount > 0

    def reemplazar(self, lista):
        with closing(self._con()) as c, c:
            c.execute("DELETE FROM tareas")
            for t in lista:
                c.execute(UPSERT, {**t, "hecha": int(t["hecha"])})
