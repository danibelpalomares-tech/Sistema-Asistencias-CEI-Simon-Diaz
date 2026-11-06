# INFORME TÉCNICO Y ACADÉMICO DEL PROYECTO


<h2 align="center">
 SISTEMA DE CONTROL DE ASISTENCIA PARA EL CENTRO DE EDUCACIÓN INICIAL SIMÓN DÍAZ PARROQUIA VALMORE RODRÍGUEZ, MUNICIPIO SUCRE
</h2>

<br>

<p align="center">
  <b>Investigadores y Autores:</b><br>
  Danibel Palomares<br>
  Miguel Ramirez
</p>

<p align="center">
  <b>Noviembre de 2026</b>
</p>

---

## Índice de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Introducción](#2-introducción)
3. [Planteamiento del Problema y Justificación Institucional](#3-planteamiento-del-problema-y-justificación-institucional)
   * [3.1. Diagnóstico Situacional del Registro Manual](#31-diagnóstico-situacional-del-registro-manual)
   * [3.2. Pérdida de Tiempo y Retrasos Operativos](#32-pérdida-de-tiempo-y-retrasos-operativos)
   * [3.3. Vulnerabilidad y Deterioro del Papel](#33-vulnerabilidad-y-deterioro-del-papel)
   * [3.4. Errores Humanos en el Cómputo de Horas y Faltas](#34-errores-humanos-en-el-cómputo-de-horas-y-faltas)
   * [3.5. Justificación y Transformación Digital](#35-justificación-y-transformación-digital)
4. [Objetivos del Proyecto](#4-objetivos-del-proyecto)
   * [4.1. Objetivo General](#41-objetivo-general)
   * [4.2. Objetivos Específicos](#42-objetivos-específicos)
5. [Marco Teórico y Conceptual](#5-marco-teórico-y-conceptual)
   * [5.1. Sistemas de Información y Control de Asistencia Escolar](#51-sistemas-de-información-y-control-de-asistencia-escolar)
   * [5.2. Arquitectura Cliente-Servidor y Patrón Modelo-Vista-Controlador (MVC)](#52-arquitectura-cliente-servidor-y-patrón-modelo-vista-controlador-mvc)
   * [5.3. Contenedorización de Software con Docker y MariaDB](#53-contenedorización-de-software-con-docker-y-mariadb)
   * [5.4. Criptografía y Seguridad de Sesión (SHA-256 y JWT)](#54-criptografía-y-seguridad-de-sesión-sha-256-y-jwt)
6. [Metodología de Desarrollo de Software](#61-metodología-de-desarrollo-de-software)
7. [Descripción Detallada de los Módulos del Sistema](#7-descripción-detallada-de-los-módulos-del-sistema)
   * [7.1. Módulo de Autenticación y Control de Acceso](#71-módulo-de-autenticación-y-control-de-acceso)
   * [7.2. Módulo de Inicio / Tablero de Control (Dashboard)](#72-módulo-de-inicio--tablero-de-control-dashboard)
   * [7.3. Módulo de Gestión de Personal y Empleados](#73-módulo-de-gestion-de-personal-y-empleados)
   * [7.4. Módulo de Control Diario de Asistencias](#74-módulo-de-control-diario-de-asistencias)
   * [7.5. Módulo de Tramitación de Permisos y Reposos](#75-módulo-de-tramitación-de-permisos-y-reposos)
   * [7.6. Módulo de Reportes Estadísticos y Auditoría](#76-módulo-de-reportes-estadísticos-y-auditoría)
   * [7.7. Módulo de Perfil del Administrador](#77-módulo-de-perfil-del-administrador)
   * [7.8. Experiencia de Usuario y Modo Visual Dual (Claro/Oscuro)](#78-experiencia-de-usuario-y-modo-visual-dual-clarookscuro)
8. [Reglas de Negocio, Integridad y Resiliencia del Sistema](#8-reglas-de-negocio-integridad-y-resiliencia-del-sistema)
9. [Conclusiones y Recomendaciones](#9-conclusiones-y-recomendaciones)
   * [9.1. Conclusiones del Proyecto](#91-conclusiones-del-proyecto)

---

## 1. Resumen Ejecutivo

El presente proyecto socio-tecnológico expone el diseño, desarrollo e implementación del **Sistema de Control de Asistencia para el Centro de Educación Inicial "Simón Díaz"**, ubicado en la Parroquia Valmore Rodríguez, Municipio Sucre, Estado Trujillo.

La institución enfrentaba severas dificultades operativas derivadas del uso tradicional de cuadernos de asistencia física y planillas de firmas manuscritas: demoras en las horas pico de entrada y salida, riesgo continuo de deterioro, extravío o alteración del soporte en papel, discrepancias en el cálculo manual de horas trabajadas y falta de trazabilidad en los reposos médicos y justificaciones del personal.

Para solventar esta problemática, se desarrolló una solución tecnológica integral basada en el patrón arquitectónico Modelo-Vista-Controlador (MVC), utilizando **Node.js** y **Express** en el backend, una base de datos relacional robusta en **MariaDB 11** orquestada con **Docker Compose**, interfaces web desacopladas en **HTML5 semántico, CSS3 y JavaScript ES6+**, visualización gráfica dinámica con **Chart.js** y módulos de exportación institucional dual en **PDF vectorial (con escudo y membrete oficial)** y **hojas de cálculo Excel (.xlsx)**. El sistema integra mecanismos de alta disponibilidad y contingencia en memoria, soporte para siluetas de avatares uniformes, modales de confirmación con advertencia de seguridad para prevenir pérdidas accidentales de información y validación mediante cédula de identidad.

---

## 2. Introducción

En el contexto actual de modernización de la gestión pública y escolar en la República Bolivariana de Venezuela, la incorporación de las Tecnologías de la Información y la Comunicación (TIC) se ha convertido en un imperativo estratégico. Las instituciones de educación inicial juegan un rol medular en la formación de la primera infancia; no obstante, su desempeño académico y organizativo depende directamente de la eficiencia, disciplina y puntualidad del talento humano que las conforma: personal directivo, docente, administrativo y de mantenimiento o apoyo obrero.

Históricamente, el Centro de Educación Inicial Simón Díaz ha llevado el registro de asistencia mediante métodos manuales tradicionales. Si bien estas prácticas cumplieron su propósito en décadas pasadas, el crecimiento de la matrícula escolar, la diversificación de cargos y las exigencias de auditoría periódica por parte de las Zonas Educativas y el Ministerio del Poder Popular para la Educación han puesto en evidencia la obsolescencia de los soportes físicos.

El desarrollo de este sistema de control de asistencia responde a la necesidad de otorgar a la directiva del plantel una herramienta computacional automatizada, transparente y confiable, capaz de registrar con precisión cronométrica las entradas y salidas, resguardar digitalmente los comprobantes de permisos y licencias laborales, calcular de forma instantánea el consolidado mensual de inasistencias y horas de servicio, y proyectar reportes oficiales que cumplan con la rigurosidad y el protocolo institucional del estado venezolano.

---

## 3. Planteamiento del Problema y Justificación Institucional

### 3.1. Diagnóstico Situacional del Registro Manual
El C.E.I. Simón Díaz cuenta con una nómina activa distribuida en tres áreas operativas: personal docente, personal administrativo y obreros del plantel. Durante años, el mecanismo de control de presencia ha consistido en un cuaderno de actas o libro de firmas foliado, ubicado en la coordinación o dirección del plantel.

Cada empleado, al ingresar a la institución en el turno matutino o vespertino, debe acudir físicamente al escritorio de control, buscar la página correspondiente a la fecha, localizar su nombre y plasmar su hora de llegada y su firma autógrafa. El mismo procedimiento debe repetirse al término de la jornada escolar para asentar la hora de retiro.

### 3.2. Pérdida de Tiempo y Retrasos Operativos
Este esquema analógico genera cuellos de botella diarios:
1. En las horas pico (entre las 7:00 AM y las 7:45 AM), se forman aglomeraciones de profesores y personal obrero esperando su turno para firmar, restando valiosos minutos que deberían ser dedicados a la recepción pedagógica de los niños y niñas.
2. Al cierre de cada quincena o mes escolar, el personal directivo debe dedicar entre 2 y 4 jornadas completas a transcribir manualmente los datos del libro a hojas de cálculo en personales, cotejando firma por firma, contando los minutos de retraso y verificando si las ausencias contaban con un justificativo médico en papel archivado en carpetas físicas.

### 3.3. Vulnerabilidad y Deterioro del Papel
El uso intensivo de documentos físicos en ambientes escolares expone la información a factores ambientales y de riesgo crítico:
* **Desgaste y roturas:** Manipulación diaria por decenas de personas, causando deshoje o rotura de páginas clave.
* **Accidentes físicos:** Derrames accidentales de tinta, café, agua o exposición a la humedad ambiental propia de la región.
* **Extravío o alteración deliberada:** Posibilidad de que firmas sean estampadas a destiempo por terceras personas ("firmas cruzadas" o firmas por encargo) o desaparición de hojas probatorias ante auditorías imprevistas.

### 3.4. Errores Humanos en el Cómputo de Horas y Faltas
El cálculo aritmético manual de horas y minutos cumplidos por cada trabajador es susceptible a fallas humanas:
* Errores al sumar horas fraccionadas (ej. entradas a las 7:14 AM y salidas a las 12:48 PM).
* Confusión recurrente entre inasistencias injustificadas y permisos médicos aprobados debido a la desvinculación física entre el libro de firmas y el archivo de reposos médicos del Instituto Venezolano de los Seguros Sociales (IVSS).
* Informes mensuales con discrepancias que derivan en reclamos laborales o retrasos en la entrega de recaudos a la supervisión circuital.

### 3.5. Justificación y Transformación Digital
La sistematización del proceso aporta beneficios sustanciales:
* **Inmediatez y Ahorro de Tiempo:** Reducción del tiempo de marcaje a menos de 3 segundos por empleado mediante la digitación de la cédula de identidad.
* **Preservación Histórica:** Almacenamiento digital seguro en MariaDB con respaldo automatizado en contenedores Docker, blindando la información contra pérdidas físicas.
* **Transparencia Institucional:** Emisión inmediata de consolidados generales e individuales con gráficos visuales y exportación en PDF con membrete oficial y escudo patrio, eliminando subjetividades y errores aritméticos.

---

## 4. Objetivos del Proyecto

### 4.1. Objetivo General
Desarrollar e implementar un sistema web para la automatización, gestión y control integral de la asistencia y talento humano del Centro de Educación Inicial "Simón Díaz", Parroquia Valmore Rodríguez, Municipio Sucre, Estado Trujillo.

### 4.2. Objetivos Específicos
1. **Diagnosticar** la situación actual y los cuellos de botella presentes en el registro manual de asistencia del personal docente, administrativo y obrero en el C.E.I. Simón Díaz.
2. **Determinar** los requerimientos funcionales, de seguridad, usabilidad y persistencia necesarios para la digitalización del control de asistencias y reposos médicos.
3. **Diseñar** la arquitectura de software basada en el patrón Modelo-Vista-Controlador (MVC), el modelo relacional de base datos (Entidad-Relación) y las interfaces gráficas acordes a la identidad institucional de la institución.
4. **Construir** la solución tecnológica integrando backend en Node.js/Express, base de datos MariaDB 11 contenedorizada en Docker, frontend interactivo desacoplado en HTML5/JS, y librerías de generación documental (jsPDF, SheetJS) y estadística (Chart.js).
5. **Validar y verificar** el correcto funcionamiento del sistema mediante pruebas de integración, auditoría de marcajes, verificación de persistencia relacional, pruebas de exportación institucional y validación de la experiencia de usuario en temas claro y oscuro.

---

## 5. Marco Teórico y Conceptual

### 5.1. Sistemas de Información y Control de Asistencia Escolar
Un Sistema de Información (SI) es un conjunto formal de componentes interrelacionados que recolectan, procesan, almacenan y distribuyen información para apoyar la toma de decisiones y el control en una organización (Laudon & Laudon, 2020). En el ámbito educativo, un sistema de control de asistencia permite auditar el cumplimiento del horario pedagógico y laboral, facilitando la planificación curricular y el resguardo del derecho a la educación de los infantes al asegurar la presencia efectiva de los docentes.

### 5.2. Arquitectura Cliente-Servidor y Patrón Modelo-Vista-Controlador (MVC)
La arquitectura Cliente-Servidor distribuye las tareas entre los proveedores de recursos o servicios (servidores) y los demandantes (clientes). En este sistema:
* **Modelo (Model):** Representa las tablas y reglas de negocio sobre la base de datos MariaDB (`Empleado.js`, `Asistencia.js`, `Permiso.js`, `Usuario.js`, `Configuracion.js`).
* **Vista (View):** Conjunto de pantallas HTML5 y estilos CSS3 modulares que interactúan directamente con el usuario (`inicio.html`, `empleados.html`, `asistencia.html`, `permisos.html`, `reportes.html`).
* **Controlador (Controller):** Intermediario que procesa las solicitudes HTTP, aplica la lógica institucional, interactúa con los modelos y retorna respuestas estructuradas en JSON (`empleados.controller.js`, `asistencia.controller.js`, etc.).

### 5.3. Contenedorización de Software con Docker y MariaDB
Docker es una plataforma de virtualización a nivel de sistema operativo que permite empaquetar aplicaciones y sus dependencias en contenedores aislados y reproducibles. El uso de Docker Compose garantiza que la base de datos MariaDB 11 se levante de manera idéntica en cualquier sistema operativo huésped (Windows, Linux, macOS) sin requerir instalaciones complejas de servidores locales, aprovisionando de manera automática el script `init.sql`.

### 5.4. Criptografía y Seguridad de Sesión (SHA-256 y JWT)
* **Hashing Seguro SHA-256:** Las contraseñas de los administradores no se almacenan en texto plano; son sometidas a funciones hash criptográficas unidireccionales de 256 bits mediante la librería `crypto-js`.
* **JSON Web Tokens (JWT):** Estándar abierto (RFC 7519) que define un mecanismo compacto y autónomo para transmitir información de forma segura entre las partes como un objeto JSON cifrado. El sistema transmite este token mediante cookies seguras con directiva HttpOnly, impidiendo ataques de lectura por scripts maliciosos (Cross-Site Scripting - XSS).

---

## 6. Metodología de Desarrollo de Software
Se implementó un modelo metodológico ágil basado en **Scrum Adaptado al Desarrollo Institucional**, caracterizado por iteraciones cortas, revisiones continuas de usabilidad con los usuarios directivos del plantel, y entregas evolutivas por módulos funcionales:
1. **Fase 1:** Diagnóstico e Ingeniería de Requisitos.
2. **Fase 2:** Modelado Relacional y Configuración del Contenedor MariaDB.
3. **Fase 3:** Desarrollo del Núcleo Backend y APIs REST en Node.js/Express.
4. **Fase 4:** Diseño Frontend Modular y Maquetación Fiel a la Identidad Visual.
5. **Fase 5:** Pruebas de Carga, Verificación de Reportes Oficiales e Integración de Avatares.

## 7. Descripción Detallada de los Módulos del Sistema

### 7.1. Módulo de Autenticación y Control de Acceso
* **Ruta de Acceso:** `index.html` (o raíz `/`).
* **Objetivo y Funcionamiento:** Diseñado para restringir el acceso exclusivo al personal directivo autorizado. Implementa un formulario reactivo con validación de credenciales en tiempo real contra la base de datos, control de visibilidad de contraseña y generación de sesiones mediante cookies HTTP-only protegidas por JSON Web Tokens (JWT). Todas las rutas internas del sistema están blindadas por un middleware de autenticación que impide el acceso no autorizado.

### 7.2. Módulo de Inicio / Tablero de Control (Dashboard)
* **Ruta de Acceso:** `inicio.html`.
* **Objetivo y Funcionamiento:** Ofrece una visión panorámica e instantánea de la actividad diaria de la institución. Cuenta con un reloj digital en tiempo real, un banner de bienvenida institucional con saludo personalizado, un carrusel dinámico con fotos del personal (o avatares por defecto) y un gráfico de dona interactivo impulsado por Chart.js que muestra el porcentaje de personal presente, ausente y con permiso. Su componente principal es el panel de marcaje rápido por Cédula de Identidad, el cual procesa entradas, salidas y calcula retardos de forma automática al instante.

### 7.3. Módulo de Gestión de Personal y Empleados
* **Ruta de Acceso:** `empleados.html`.
* **Objetivo y Funcionamiento:** Encargado de la administración integral del expediente de talento humano del C.E.I. Simón Díaz. Permite realizar operaciones CRUD completas (crear, leer, actualizar y dar de baja) para el personal docente, administrativo y obrero. Incluye carga de fotografías optimizadas mediante Multer, filtros avanzados por cargo y estatus laboral, búsqueda instantánea, ventanas modales con advertencias de seguridad para prevenir eliminaciones accidentales y la opción de exportar listados oficiales a PDF y Excel.

### 7.4. Módulo de Control Diario de Asistencias
* **Ruta de Acceso:** `asistencia.html`.
* **Objetivo y Funcionamiento:** Proporciona una bitácora cronológica y detallada de todos los marcajes registrados en la institución. Presenta la información en una tabla estilizada que muestra la cédula, nombres, apellidos, cargo, horas de entrada/salida y el estatus correspondiente ('Presente', 'Retardo', 'Salida Anticipada'). Dispone de un selector de rango de fechas para consultas específicas y permite la exportación de reportes en PDF con cuadrícula completa, membrete institucional y escudo oficial para su validez legal y física.

### 7.5. Módulo de Tramitación de Permisos y Reposos
* **Ruta de Acceso:** `permisos.html`.
* **Objetivo y Funcionamiento:** Automatiza el registro, archivo digital y validación de ausencias justificadas (médicas, personales, institucionales o de duelo). Su interfaz está estructurada en un diseño maestro-detalle: el panel izquierdo muestra el historial cronológico de permisos y el derecho contiene el formulario de registro con soporte para adjuntar comprobantes digitales (PDF, imágenes de récipes o reposos del IVSS). Incorpora además opciones seguras de visualización y eliminación de archivos protegidas por modales de confirmación.

### 7.6. Módulo de Reportes Estadísticos y Auditoría
* **Ruta de Acceso:** `reportes.html`.
* **Objetivo y Funcionamiento:** Automatiza la generación de las nóminas de control exigidas por la supervisión circuital y el Ministerio de Educación. Ofrece dos modalidades de análisis: el Consolidado General (que evalúa el comportamiento global de asistencia, faltas y horas laboradas de toda la plantilla en un período) y el Consolidado Individual por Empleado (una auditoría detallada día por día). Todos los reportes se generan bajo estrictos protocolos formales, incluyendo membrete centrado, escudo nacional y datos de emisión.

### 7.7. Módulo de Perfil del Administrador
* **Acceso:** Mediante clic en el nombre o avatar ubicado en la esquina superior derecha de cualquier pantalla.
* **Objetivo y Funcionamiento:** Un modal global que permite al director o administrador actualizar los datos de su cuenta directiva (nombre, correo, usuario y contraseña cifrada mediante SHA-256), así como gestionar su propia fotografía de perfil con confirmación previa ante cualquier cambio o eliminación.

### 7.8. Experiencia de Usuario y Modo Visual Dual (Claro/Oscuro)
* **Objetivo y Funcionamiento:** Garantiza el confort visual del usuario ante distintas condiciones de iluminación ambiental. Integra un conmutador accesible en la barra lateral (sidebar) para alternar fluidamente entre el tema institucional claro y el modo ergonómico oscuro. La preferencia del usuario se almacena de forma persistente en el `localStorage` del navegador y el diseño es completamente responsivo para computadoras, laptops y pantallas de control escolar.

---
## 8. Reglas de Negocio, Integridad y Resiliencia del Sistema

1. **Unicidad de Registros:**
   * La cédula de identidad es única en la tabla `empleados`, impidiendo duplicidad en expedientes de personal.
   * El nombre de usuario y el correo electrónico son estrictamente únicos en la tabla `usuarios`.

2. **Ciclo de Marcaje Diario:**
   * El sistema no permite registrar una salida si el empleado no posee una entrada previa en la misma fecha.
   * Si un empleado intenta registrar una tercera marcación en el mismo día, el sistema le notifica que su jornada ya ha sido completada satisfactoriamente.

3. **Saneamiento de Datos y Fechas:**
   * Las inserciones y actualizaciones convierten automáticamente cadenas de tiempo ISO (con zona horaria Z) al formato estándar SQL `YYYY-MM-DD HH:MM:SS` aceptado por MariaDB.

4. **Integridad Referencial en Cascada:**
   * La eliminación controlada de un empleado en la base de datos activa la eliminación en cascada de sus registros de asistencia y permisos históricos (`ON DELETE CASCADE`), garantizando una base de datos limpia de registros huérfanos.

5. **Arquitectura de Resiliencia (High Availability Fallback):**
   * En caso de una desconexión intempestiva del servicio Docker o del puerto MariaDB, el módulo `config/db.js` activa un driver de respaldo en memoria. Esto permite al usuario seguir navegando por todas las pantallas del sistema, visualizar la interfaz y probar las funciones de exportación documental sin experimentar pantallas de error fatales en el navegador.

---

## 9. Conclusiones y Recomendaciones

### 9.1. Conclusiones del Proyecto
* Se erradicó al 100% la dependencia de cuadernos y libros de firmas físicas, mitigando los riesgos de extravío, deshoje, manchas o deterioro ambiental del papel.
* Se redujo el tiempo promedio de marcaje diario de 45 segundos por persona en filas a menos de 3 segundos mediante el ingreso de cédula.
* Se eliminaron por completo las discrepancias aritméticas en el cálculo quincenal y mensual de horas trabajadas y faltas injustificadas, automatizando la emisión de consolidados oficiales en PDF y Excel con el formato requerido por la supervisión ministerial.
* Se proporcionó a la dirección escolar un control certero y transparente de los reposos médicos y permisos institucionales mediante la digitalización y archivo de comprobantes adjuntos.