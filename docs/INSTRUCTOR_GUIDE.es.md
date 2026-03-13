# Guía del Instructor (ES)

## 1. Propósito
Este simulador permite practicar interpretación de monitor multiparámetro en entorno docente, evitando pistas textuales en la pantalla del estudiante.

## 2. Flujo recomendado
1. Abre `control.html` (instructor).
2. Abre `monitor.html` (estudiante).
3. Ajusta parámetros base por perfil clínico.
4. Ejecuta eventos clínicos y valora interpretación del estudiante.
5. Usa alarmas técnicas para introducir artefactos y desconexiones.

## 3. Filosofía pedagógica
- El estudiante debe interpretar trazados y valores, no leer diagnósticos directos.
- El monitor del estudiante muestra estado de alarma genérico, sin nombre de evento.
- El panel de control concentra la información de orquestación para el instructor.

## 4. Escenarios sugeridos
### Escenario A: Deterioro respiratorio
1. Perfil inicial: normal.
2. Evento: desaturación o apnea.
3. Objetivo docente: reconocer hipoxemia, cambios de frecuencia respiratoria y tendencia hemodinámica.

### Escenario B: Compromiso hemodinámico
1. Perfil inicial: compensated sepsis o shock.
2. Ajustar presión sistólica/diastólica y ETCO2.
3. Objetivo docente: priorizar interpretación de perfusión y estado de choque.

### Escenario C: Asistolia
1. Presiona `Start asystole`.
2. Verifica línea casi plana en ECG + alarma activa.
3. Objetivo docente: reconocer asistolia por monitor y activar protocolo correspondiente.
4. Para finalizar, usa `Stop asystole`.

## 5. Audio y alarmas
- El audio de referencia está embebido en el proyecto y funciona offline.
- Si el audio de referencia falla, el sistema usa tonos sintéticos automáticamente.
- El volumen inicial arranca en 10%.
- La alarma continua de asistolia responde al control de volumen en tiempo real.

## 6. Buenas prácticas de evaluación
- Pide al estudiante verbalizar: ritmo, frecuencia, oxigenación, ventilación y presión.
- Cambia un solo eje al inicio; combina variables después.
- Introduce artefactos (ej. `ECG leads off`) para evaluar juicio clínico y técnico.
- Realiza debriefing corto al final de cada caso.

## 7. Solución de problemas
### No hay sonido
1. Verifica `Sound` activo.
2. Sube `Alarm volume`.
3. Interactúa con la página (click/tecla) para desbloquear audio del navegador.

### No sincroniza control-monitor
1. Confirma que ambas ventanas están abiertas.
2. Reabre `monitor.html` desde `Open monitor`.

### Asistolia no se ve clara
1. Asegura `Start asystole` activo.
2. Verifica que no esté en pausa general (`Pause/Start`).

## 8. Checklist rápido antes de clase
1. Abrir control y monitor.
2. Verificar sincronización.
3. Confirmar audio y volumen.
4. Probar `Start asystole` / `Stop asystole`.
5. Restablecer perfil base.
