import pytest

from backend.app import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path / "test.db"))
    app.config["TESTING"] = True
    return app.test_client()


MANUAL = {"nombre": "Parcial", "materia": "Física", "tipo": "Examen",
          "prioridad": "alta", "peso": 25, "fecha": "2030-01-15"}


def test_health(client):
    assert client.get("/api/health").json == {"ok": True}


def test_frontend_se_sirve(client):
    r = client.get("/")
    assert r.status_code == 200 and b"OEFO" in r.data


def test_crear_desde_texto_libre_y_listar(client):
    r = client.post("/api/tareas", json={"texto": "examen de cálculo el viernes, urgente"})
    assert r.status_code == 201
    t = r.json["tareas"][0]
    assert (t["materia"], t["tipo"], t["prioridad"]) == ("Cálculo", "Examen", "alta")
    assert len(client.get("/api/tareas").json["tareas"]) == 1


def test_varias_tareas_en_un_texto(client):
    r = client.post("/api/tareas", json={"texto": "trabajo de literatura y examen de física el viernes"})
    assert len(r.json["tareas"]) == 2


def test_crear_manual(client):
    assert client.post("/api/tareas", json=MANUAL).status_code == 201


@pytest.mark.parametrize("cambio", [
    {"nombre": ""}, {"fecha": ""}, {"fecha": "2030-13-45"}, {"fecha": "15/01/2030"},
    {"peso": 150}, {"peso": "mucho"}, {"tipo": "Otro"}, {"prioridad": "urgentísima"},
])
def test_validacion_rechaza_datos_malos(client, cambio):
    r = client.post("/api/tareas", json={**MANUAL, **cambio})
    assert r.status_code == 400 and "error" in r.json
    assert client.get("/api/tareas").json["tareas"] == []   # no se guardó nada


def test_texto_vacio_rechazado(client):
    assert client.post("/api/tareas", json={"texto": "  "}).status_code == 400


def test_actualizar_y_marcar_hecha(client):
    id_ = client.post("/api/tareas", json=MANUAL).json["tareas"][0]["id"]
    r = client.put(f"/api/tareas/{id_}", json={"hecha": True, "nombre": "Parcial 1"})
    assert r.status_code == 200
    t = client.get("/api/tareas").json["tareas"][0]
    assert t["hecha"] is True and t["nombre"] == "Parcial 1" and t["materia"] == "Física"


def test_actualizar_inexistente_404(client):
    assert client.put("/api/tareas/nada", json={"hecha": True}).status_code == 404


def test_eliminar(client):
    id_ = client.post("/api/tareas", json=MANUAL).json["tareas"][0]["id"]
    assert client.delete(f"/api/tareas/{id_}").status_code == 204
    assert client.delete(f"/api/tareas/{id_}").status_code == 404
    assert client.get("/api/tareas").json["tareas"] == []


def test_sync_reemplaza_todo_y_valida(client):
    client.post("/api/tareas", json=MANUAL)
    r = client.post("/api/sync", json={"tareas": [{**MANUAL, "id": "a"}, {**MANUAL, "id": "b"}]})
    assert [t["id"] for t in r.json["tareas"]] == ["a", "b"]
    assert client.post("/api/sync", json={"tareas": [{**MANUAL, "peso": 999}]}).status_code == 400
    assert len(client.get("/api/tareas").json["tareas"]) == 2   # el sync inválido no borró nada


def test_interpretar_no_guarda(client):
    r = client.post("/api/interpretar", json={"texto": "trabajo de historia el lunes"})
    assert r.json["tareas"][0]["materia"] == "Historia"
    assert client.get("/api/tareas").json["tareas"] == []


def test_resumen(client):
    client.post("/api/tareas", json=MANUAL)
    r = client.get("/api/resumen").json
    assert r["pendientes"] == 1 and 0 <= r["riesgo_global"] <= 100 and r["materias"][0]["materia"] == "Física"


def test_asistente(client):
    client.post("/api/tareas", json=MANUAL)
    assert "Parcial" in client.post("/api/asistente", json={"pregunta": "¿qué me recomiendas hacer?"}).json["respuesta"]
    assert client.post("/api/asistente", json={"pregunta": ""}).status_code == 400


def test_css_y_js_se_sirven(client):
    assert client.get("/css/styles.css").status_code == 200
    assert client.get("/js/main.js").status_code == 200
    assert client.get("/js/no-existe.js").status_code == 404
