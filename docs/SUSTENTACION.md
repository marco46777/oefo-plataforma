# Guía de sustentación — OEFO

## 1. La idea en 30 segundos
Los estudiantes olvidan entregas porque ninguna herramienta cruza sus materias ni les dice qué hacer primero.
OEFO entiende lo que el estudiante escribe, calcula el riesgo de cada entrega y de cada materia, y le recomienda por dónde empezar.

## 2. "Un sistema, no una IA pegada" (diapositiva 2)
Usuario → Interfaz/UX → Aplicación → Datos + Servicio IA → Lógica → Decisión → Acción → Usuario

| Eslabón de la diapositiva | En OEFO |
|---|---|
| Interfaz / UX | `frontend/index.html` + `frontend/css/` + `frontend/js/` |
| Aplicación | `backend/app.py` (API, validación) |
| Datos | `backend/db.py` (SQLite) |
| Servicio IA | `backend/logic.py` → `interpretar`, `respuesta_asistente` |
| Lógica → Decisión | `riesgo_tarea`, `riesgo_global`, `por_materia`, plan semanal |
| Acción | Mostrar resultado, enlace a Google Calendar, aviso del navegador |

**Por qué no es una "IA pegada":** nunca se muestra lo que "diga la IA" sin pasar por validación (`limpiar`),
hay reglas deterministas alrededor, el sistema sigue funcionando si la interpretación falla (formulario manual / edición),
y todo está cubierto por 46 pruebas automáticas.

## 3. Las capas (diapositiva 1)
- **Sistema:** la aplicación que recibe información y produce resultados.
- **Datos:** tareas (nombre, materia, tipo, fecha, prioridad, peso, estado).
- **Inteligencia:** clasifica texto libre, predice riesgo, recomienda la próxima acción, interpreta preguntas.
- **Automatización (la cuarta):** contar días, ordenar, validar, guardar, generar el enlace de Calendar, disparar avisos por fecha.

Regla para explicarlo: hay *inteligencia* donde hay que interpretar algo ambiguo (texto libre); hay *automatización* donde se sigue una regla fija sobre datos limpios.

## 4. Demo de 3 minutos
1. `python -m backend.app` y abrir la página (etiqueta 🟢 Servidor conectado).
2. Escribir `examen de cálculo el viernes, vale 30%, urgente` → **una** tarea, Examen, alta, 30 %.
3. Escribir `trabajo de literatura y examen de física el lunes` → dos tareas.
4. Preguntar al asistente "¿cuál es mi materia más riesgosa?".
5. Editar una tarea que interpretó mal (la IA puede fallar y el usuario tiene el control).
6. Detener el servidor y recargar: sigue funcionando en modo local. Volver a iniciarlo: los datos persisten.
7. Mostrar `python -m pytest` en verde.

## 5. Preguntas probables y respuestas honestas
- **¿Usan IA de verdad?** Usan reglas y heurísticas que cumplen las funciones de la capa de inteligencia (clasificar, predecir riesgo, recomendar, interpretar). No es un modelo entrenado; la arquitectura permite cambiar `logic.interpretar` por un modelo de lenguaje sin tocar el resto.
- **¿Por qué no llamar directamente a ChatGPT?** Porque eso sería el "error común" de la diapositiva: sin datos propios, sin reglas, sin validación y sin control sobre la respuesta.
- **¿Qué pasa si se equivoca?** El usuario ve la tarea creada, puede editarla, y el servidor rechaza datos inválidos. (Prueba 5 de la propuesta.)
- **¿Servicio IA separado?** Hoy es un módulo separado dentro del mismo proceso; en producción sería un servicio aparte detrás de la API.
- **¿Y la seguridad / varios usuarios?** No implementado todavía (sin cuentas ni HTTPS). Está listado como siguiente paso.
- **¿Por qué hay lógica en el frontend y en el servidor?** Para que la página funcione sin conexión; ambas versiones dan el mismo resultado (se comprobó con las mismas frases en 4 zonas horarias).

## 6. Lo que NO hace todavía (no lo sobrevendan)
Cuentas de usuario, despliegue en internet, modelo de lenguaje real, sincronización entre dispositivos, lectura automática del calendario de la universidad.
