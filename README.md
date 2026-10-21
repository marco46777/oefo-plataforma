# OEFO — Copiloto Académico

Plataforma web para que un estudiante registre sus tareas **escribiendo en lenguaje natural**
("examen de cálculo el viernes, vale 30%, urgente") y reciba tipo, materia, fecha, prioridad,
riesgo académico, plan semanal y recomendaciones.

## Ejecutar

Requiere Python 3.10+.

```bash
pip install -r requirements.txt
python -m backend.app          # abre http://127.0.0.1:5000
python -m pytest               # 46 pruebas automáticas
```

(En Windows usa `py` en lugar de `python`.) Variables opcionales: `PORT` y `OEFO_DB` (ruta del archivo SQLite).

`frontend/index.html` también funciona **abierto directamente** en el navegador, sin servidor:
la etiqueta de arriba cambia de "🟢 Servidor conectado" a "⚪ Modo local" y los datos quedan en el navegador.

## Arquitectura (las capas de la clase)

| Capa | Dónde está | Qué hace |
|---|---|---|
| Sistema | `frontend/index.html` + `backend/app.py` | Interfaz, API REST, validación de entradas |
| Datos | `backend/db.py` (SQLite) | Guarda y recupera tareas |
| Inteligencia | `backend/logic.py` | Interpreta texto libre, calcula riesgo, recomienda, responde preguntas |
| Automatización | reglas en `logic.py`, `app.py` y el frontend | Contar días, ordenar, validar, guardar, enlace a Google Calendar, avisos del navegador |

Flujo: Usuario → Interfaz → API (`app.py`) → Datos (`db.py`) + Inteligencia (`logic.py`) → decisión (riesgo/plan) → respuesta al usuario.

## Estructura del frontend

```
frontend/
├── index.html          # solo la estructura de la página (HTML)
├── css/styles.css      # todos los estilos, por secciones
└── js/                 # JavaScript dividido por responsabilidad (se cargan en este orden)
    ├── estado.js          # variables globales y estado
    ├── servidor.js        # llamadas a la API
    ├── almacenamiento.js  # localStorage + sincronización
    ├── utilidades.js      # fechas, escape de HTML, Google Calendar, confeti, toast
    ├── interpretacion.js  # IA 1/3: texto libre -> tarea
    ├── riesgo.js          # IA 2/3: riesgo por tarea/materia/global
    ├── asistente.js       # IA 3/3: respuestas del asistente
    ├── render.js          # dibuja la pantalla
    ├── acciones.js        # agregar, editar, eliminar, formularios, respaldo
    ├── enfoque.js         # modo enfoque (Pomodoro)
    ├── compartir.js       # copiar plan y vista de solo lectura
    ├── notificaciones.js  # avisos del navegador
    └── main.js            # arranque (va al final)
```

## API

| Método y ruta | Función |
|---|---|
| `GET /api/health` | Estado del servicio |
| `GET /api/tareas` | Lista tareas |
| `POST /api/tareas` | Crea una tarea (campos) o varias (`{"texto": "..."}`) |
| `PUT /api/tareas/<id>` | Actualiza campos de una tarea |
| `DELETE /api/tareas/<id>` | Elimina una tarea |
| `POST /api/sync` | Reemplaza todas las tareas (lo usa el frontend) |
| `POST /api/interpretar` | Interpreta texto sin guardarlo |
| `GET /api/resumen` | Riesgo global, pendientes, atrasadas, riesgo por materia |
| `POST /api/asistente` | Responde una pregunta sobre las tareas |

Las entradas inválidas responden `400` con `{"error": "..."}`.

## Limitaciones conocidas (dichas con honestidad)

- **No hay cuentas de usuario**: el servidor guarda un único conjunto de tareas. No es multiusuario.
- **La "inteligencia" son reglas/heurísticas**, no un modelo de lenguaje entrenado. Puede equivocarse con frases inusuales; por eso toda tarea se puede editar.
- El frontend sincroniza la lista completa (`/api/sync`) y mantiene una copia de las reglas de riesgo para poder funcionar sin servidor.
- Sin HTTPS ni despliegue en producción (servidor de desarrollo de Flask). SQLite es suficiente para un grupo pequeño, no para miles de usuarios simultáneos.

## Próximos pasos
1. Autenticación y una tabla de usuarios. 2. Reemplazar `logic.interpretar` por un modelo de lenguaje manteniendo la misma firma y la validación de `limpiar`. 3. PostgreSQL y despliegue (contenedor + HTTPS). 4. Integración con el calendario académico de la universidad.
# oefo-plataforma
