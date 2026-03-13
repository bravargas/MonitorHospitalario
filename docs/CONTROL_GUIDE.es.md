# Guía de uso del control (ES)

## 1. Objetivo del panel de control
El panel de control permite al instructor modificar signos vitales, activar eventos clínicos, simular alarmas técnicas y gestionar el ritmo de la sesión en tiempo real.

## 2. Inicio rápido (30 segundos)
1. Abre `control.html`.
2. Abre `monitor.html` desde el botón **Open monitor**.
3. Verifica estado de sincronización en la cabecera.
4. Ajusta volumen de alarmas según el aula.
5. Selecciona un perfil inicial (por ejemplo **Normal**).

## 3. Cabecera superior
### Sync status
- Muestra si el monitor estudiante está detectado y recibiendo cambios.

### Alarm active
- Estado global de alarmas para el instructor.
- No revela diagnósticos al estudiante.

### Pause / Start
- Pausa o reanuda la evolución dinámica del simulador.

### Reset
- Vuelve a perfil base clínico normal para reiniciar una práctica.

### Open monitor
- Abre la vista del estudiante en una nueva pestaña/ventana.

## 4. Controles de visualización
### Grid
- Activa/desactiva la grilla de trazado en el monitor.

### Diagnostic
- Muestra/oculta información diagnóstica visual en la vista del estudiante.

## 5. Alarmas y audio
### Alarms
- Habilita o silencia el sistema de alarmas (lógica y aviso sonoro/estado).

### Sound
- Habilita o deshabilita audio general del simulador.

### Alarm volume
- Ajusta volumen global de alarmas y tonos.
- Valor inicial por defecto: 10%.

## 6. Alarmas técnicas
Estas alarmas sirven para entrenar diagnóstico diferencial entre falla clínica y falla de sensor.

### ECG leads off
- Simula desconexión de electrodos ECG.

### SpO2 sensor off
- Simula sensor de saturación desconectado.

### TEMP probe off
- Simula sonda de temperatura desconectada.

## 7. Configuración del paciente
### Patient type
- Cambia entre adulto, pediátrico y neonato.
- Ajusta límites y comportamiento fisiológico base.

### Channel 2
- Selecciona señal secundaria: CVP, ART2, PAP, ICP o desconectado.

### ST profile
- Aplica perfil de segmento ST para entrenamiento de interpretación ECG.

### Patient name
- Etiqueta visible del paciente para el escenario docente.

### ECG gain
- Ajusta amplitud visual del trazado ECG.

### ECG sweep speed
- Ajusta velocidad de barrido (mm/s).

### Temperature unit
- Cambia unidad de temperatura entre °C y °F.

## 8. Eventos clínicos
### Clinical event
- Selecciona evento preconfigurado (desaturación, apnea, shock, etc.).

### Event duration / Hold phase
- Permite ajustar duración total y fase de mantenimiento del evento.

### Start event
- Inicia transición fisiológica del evento seleccionado.

### Stop event
- Detiene el evento activo.

### NIBP now
- Fuerza una medición no invasiva de presión arterial en ese momento.

### Start asystole / Stop asystole
- Activa o desactiva asistolia.
- Simula ECG en línea casi plana y alarma crítica asociada.

## 9. Atajos por perfil (botones rápidos)
Botones como **Normal**, **Tachycardia**, **Bradycardia**, **Hypoxia**, **Shock**, etc., aplican estados clínicos predefinidos para montar escenarios en segundos.

## 10. Ajuste manual de variables
La zona de controles numéricos y sliders permite modificar:
- HR
- RESP
- SpO2
- ETCO2
- SYS/DIA
- CVP
- TEMP

Recomendación docente:
1. Cambia una variable principal al inicio.
2. Luego combina 2 o 3 para mayor complejidad clínica.

## 11. Flujo sugerido de sesión
1. Estado base normal (30-60 s).
2. Introduce un evento (ej. desaturación).
3. Evalúa interpretación oral del estudiante.
4. Añade artefacto técnico (ej. SpO2 off) para discriminar fallo clínico vs sensor.
5. Cierra con debriefing breve.

## 12. Solución de problemas del control
### El monitor no refleja cambios
1. Verifica Sync status.
2. Pulsa Open monitor y vuelve a abrir la vista estudiante.

### No hay audio
1. Verifica Sound activado.
2. Sube Alarm volume.
3. Haz click en la página para desbloquear audio del navegador.

### Asistolia no suena continua
1. Verifica Alarms y Sound activados.
2. Confirma que Start asystole esté activo.

## 13. Buenas prácticas docentes
1. Evita dar pistas verbales de diagnóstico al inicio.
2. Prioriza que el estudiante describa primero signos observables.
3. Registra tiempos de respuesta y decisiones críticas.
4. Repite escenarios con variaciones leves para medir aprendizaje.
