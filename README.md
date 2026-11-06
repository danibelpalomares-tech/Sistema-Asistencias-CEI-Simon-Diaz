# SISTEMA DE CONTROL DE ASISTENCIA PARA EL CENTRO DE EDUCACIÓN INICIAL SIMÓN DÍAZ

[![Node.js](https://img.shields.io/badge/Node.js-18.x%20--%2022.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MariaDB](https://img.shields.io/badge/MariaDB-11.x-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-3.x-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Licencia](https://img.shields.io/badge/Licencia-Educativa%20Institucional-blue?style=for-the-badge)](#)

---
### 📋 Datos de Autoría e Institución
* **Proyecto:** Sistema de Control de Asistencia y Gestión de Personal.
* **Autores e Investigadores:** 
  * **Danibel Palomares**
  * **Miguel Ramirez**
* **Institución Beneficiaria:** Centro de Educación Inicial (C.E.I.) "Simón Díaz"
* **Ubicación Geográfica:** Parroquia Valmore Rodríguez, Municipio Sucre, Estado Trujillo, República Bolivariana de Venezuela.

---

## 📑 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Características Principales](#-características-principales)
3. [Módulos del Sistema](#-módulos-del-sistema)
4. [Stack Tecnológico y Herramientas](#-stack-tecnológico-y-herramientas)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
   * [Requisitos Previos](#1-requisitos-previos)
   * [Paso 1: Clonar o Descargar el Proyecto](#paso-1-clonar-o-descargar-el-proyecto)
   * [Paso 2: Configuración de Variables de Entorno (.env)](#paso-2-configuración-de-variables-de-entorno-env)
   * [Paso 3: Despliegue de Base de Datos con Docker](#paso-3-despliegue-de-base-de-datos-con-docker)
   * [Paso 4: Instalación de Dependencias Node.js](#paso-4-instalación-de-dependencias-nodejs)
   * [Paso 5: Ejecución del Servidor Web](#paso-5-ejecución-del-servidor-web)
7. [Credenciales de Acceso por Defecto](#-credenciales-de-acceso-por-defecto)
8. [Arquitectura de Resiliencia y Alta Disponibilidad](#-arquitectura-de-resiliencia-y-alta-disponibilidad)
9. [Documentación Complementaria](#-documentación-complementaria)

---
## 🔍 Descripción General

El **Sistema de Control de Asistencia para el C.E.I. "Simón Díaz"** es una aplicación web y de escritorio desarrollada para automatizar el control de asistencia del personal del plantel. 

Anteriormente, la institución llevaba el registro de entradas, salidas y ausencias de forma completamente manual en cuadernos y planillas de firmas físicas, lo que generaba un alto consumo de tiempo, desgaste operativo y el riesgo latente de perder información valiosa. Este software soluciona dicha problemática digitalizando todo el flujo administrativo, permitiendo un control en tiempo real, la gestión de permisos con soportes digitales y la emisión de reportes automatizados de forma rápida y segura.

---

## 🚀 Características Principales

* **Interfaz Moderna y Funcional:** Diseño web limpio, intuitivo y responsivo, estructurado con componentes visuales modernos para facilitar la navegación diaria del personal administrativo.
* **Registro por Cédula de Identidad:** Marcaje ágil de entradas y salidas desde el panel principal con validación instantánea del empleado.
* **Avatares y Gestión de Fotografías:** Soporte para fotografías reales del personal y asignación de un avatar predeterminado cuando no se disponga de imagen.
* **Exportación a PDF y Excel:** Generación de reportes institucionales listos para imprimir o exportar a formato tabular (`.xlsx`) y documentos formales.
* **Módulo de Permisos con Archivos Adjuntos:** Permite tramitar ausencias justificadas cargando documentos probatorios (PDF, JPG, PNG) con control de vigencia por rangos de fechas (*Desde - Hasta*).
* **Gráficas y KPIs Dinámicos:** Dashboard principal con gráficos interactivos que muestran el resumen diario de asistencia (Presentes, Ausentes y Permisos).
* **Modo Oscuro Integrado:** Conmutador de tema para adaptar la interfaz a diferentes condiciones de iluminación ambiental.
* **Seguridad y Control:** Autenticación segura mediante sesiones protegidas y contraseñas cifradas.

---

## 🧩 Módulos del Sistema

| Módulo | Ruta Web | Descripción y Funcionalidades Clave |
| :--- | :--- | :--- |
| **Inicio / Dashboard** | `/inicio.html` | Tablero principal con reloj digital en vivo, banner de bienvenida con ilustración institucional adaptada, módulo de marcaje rápido por cédula, carrusel de fotos de empleados y gráfica interactiva de resumen diario. |
| **Gestión de Empleados** | `/empleados.html` | Directorio completo del personal (Docente, Administrativo, Mantenimiento). Permite registrar, editar, cambiar o eliminar a empleados y sus fotografías de perfil (con modal de advertencia previa), filtrar por cargo y estatus, y exportar listados oficiales. |
| **Control de Asistencia** | `/asistencia.html` | Bitácora de marcajes diarios. Registra hora de entrada, hora de salida. Filtroado de fechas y exportación dual (PDF con cuadrícula completa y Excel). |
| **Permisos y Reposos** | `/permisos.html` | Gestión de ausencias justificadas (médicas, personales, institucionales). Permite adjuntar y visualizar soportes digitales (PDF/imagen), eliminar justificativos de forma segura con confirmación y consultar el historial en vista maestro-detalle. |
| **Reportes y Estadísticas** | `/reportes.html` | Generación de **Consolidado General** (horas trabajadas, inasistencias injustificadas, días asistidos, permisos) y **Consolidado Individual por Empleado** (desglose detallado por día). KPIs numéricos y gráficas estadísticas exportables. |
| **Perfil del Administrador** | Modal Global | Configuración de la cuenta directiva: actualización de nombre, correo, usuario, contraseña cifrada y avatar con modal de confirmación antes de la eliminación permanente. |

---

## 🛠️ Stack Tecnológico y Herramientas

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Lenguaje Backend** | Node.js (v18+) | Entorno de ejecución asíncrono para la lógica del servidor y la API REST. |
| **Framework Web** | Express.js 4.x | Enrutamiento modular, controladores y middleware de autenticación y carga de archivos. |
| **Base de Datos** | MariaDB 11.x | Motor relacional robusto con motor de almacenamiento InnoDB y codificación UTF-8 mb4. |
| **ORM / Acceso a Datos**| `mysql-tab` & `mysql2` | Librería Active Record para consultas preparadas, transacciones y sanitización SQL. |
| **Contenerización** | Docker & Docker Compose | Aislamiento, despliegue reproducible y aprovisionamiento automático mediante `init.sql`. |
| **Seguridad y Criptografía** | `crypto-js` & `jsonwebtoken` | Cifrado SHA-256 de credenciales y generación de JWT en cookies de sesión HttpOnly. |
| **Gestión Multimedia** | Multer | Subida y validación de tipos MIME de fotografías de perfil y justificativos en PDF/imágenes. |
| **Frontend UI/UX** | HTML5, CSS3 & JavaScript (ES6+) | Diseño modular desacoplado por pantalla, sin frameworks pesados, con animaciones fluidas y variables CSS. |
| **Visualización Gráfica** | Chart.js 3.x | Renderizado responsivo de gráficos de dona interactivos con porcentajes flotantes. |
| **Exportación Documental** | `jsPDF`, `jsPDF-AutoTable` & `SheetJS` | Generación del lado del cliente de documentos PDF oficiales con membrete y libros Excel (.xlsx). |

---

## 📂 Estructura del Proyecto

```text
Sistema de Asistencias CEI Simon Diaz/
├── config/
│   └── db.js                 # Conexión dual (MariaDB pool + motor de fallback en memoria)
├── controllers/
│   ├── admin.controller.js   # Lógica del perfil y foto del administrador
│   ├── asistencia.controller.js # Registro rápido, listados y métricas del día
│   ├── auth.controller.js    # Autenticación, inicio y cierre de sesión con JWT
│   ├── empleados.controller.js # CRUD completo de personal y gestión de fotos
│   ├── permisos.controller.js  # Tramitación de permisos y justificativos adjuntos
│   └── reportes.controller.js  # Cálculos para consolidado general e individual
├── middleware/
│   └── auth.middleware.js    # Verificación de JWT en cookies para protección de rutas
├── models/
│   ├── Asistencia.js         # Modelo relacional de asistencias
│   ├── Configuracion.js      # Modelo clave-valor de configuración institucional
│   ├── Empleado.js           # Modelo relacional de empleados
│   ├── Permiso.js            # Modelo relacional de permisos
│   └── Usuario.js            # Modelo relacional de usuarios administradores
├── public/
│   ├── assets/               # Escudo institucional, ilustración, fachada y avatares
│   │   ├── default-avatar.png# Silueta predeterminada del sistema ("muñequito")
│   │   ├── escudo.png        # Escudo oficial de la República y del plantel
│   │   ├── fachada.jpeg      # Imagen de la fachada del C.E.I. Simón Díaz
│   │   └── ilustracion.png   # Ilustración vectorial de inicio
│   ├── css/                  # Hojas de estilo modulares por interfaz
│   │   ├── common.css        # Variables de color, fuentes, sidebar y modo oscuro
│   │   ├── login.css         # Estilos específicos de inicio de sesión
│   │   ├── inicio.css        # Estilos del dashboard y módulo de registro
│   │   ├── empleados.css     # Estilos de tarjetas, tablas y modales de empleados
│   │   ├── asistencia.css    # Estilos del registro de asistencia y filtros
│   │   ├── permisos.css      # Estilos maestro-detalle y subida de archivos
│   │   └── reportes.css      # Estilos de consolidado, KPIs y gráficos
│   ├── js/                   # Controladores JavaScript del cliente
│   │   ├── common.js         # Modal admin, reloj, exportaciones PDF/Excel y tema
│   │   ├── login.js          # Petición de login y validación de formulario
│   │   ├── inicio.js         # Lógica de registro rápido, resumen y gráfica Chart.js
│   │   ├── empleados.js      # Peticiones CRUD, modales de confirmación y filtros
│   │   ├── asistencia.js     # Lógica de marcaje, tabla y filtros de fecha
│   │   ├── permisos.js       # Lógica maestro-detalle y confirmación de borrado
│   │   └── reportes.js       # Generación de reportes general e individual
│   ├── index.html            # Pantalla de Inicio de Sesión (Login)
│   ├── inicio.html           # Pantalla de Dashboard / Menú Principal
│   ├── empleados.html        # Pantalla de Gestión de Personal
│   ├── asistencia.html       # Pantalla de Control de Asistencias
│   ├── permisos.html         # Pantalla de Gestión de Permisos
│   └── reportes.html         # Pantalla de Reportes y Estadísticas
├── routes/
│   ├── admin.routes.js       # Endpoints de administración de perfil
│   ├── asistencia.routes.js  # Endpoints de marcaje y asistencias
│   ├── auth.routes.js        # Endpoints de inicio/cierre de sesión
│   ├── empleados.routes.js   # Endpoints de gestión de empleados
│   ├── permisos.routes.js    # Endpoints de permisos y justificativos
│   └── reportes.routes.js    # Endpoints de reportes y consolidados
├── uploads/
│   ├── admin/                # Fotografías de administradores
│   ├── empleados/            # Fotografías de perfil del personal
│   └── justificativos/       # Documentos probatorios (PDF, JPG, PNG)
├── docker-compose.yml        # Configuración del contenedor MariaDB 11
├── init.sql                  # Script DDL de base de datos e inicialización
├── .env                      # Variables de entorno y configuración de conexión
├── server.js                 # Punto de entrada de la aplicación Express
├── package.json              # Metadatos del proyecto y dependencias npm
├── diagrama-er.md            # Documentación técnica del modelo Entidad-Relación
└── informe.md                # Informe académico y técnico universitario completo
```

---

## ⚙️ Instalación y Puesta en Marcha

Sigue estos sencillos pasos para clonar, configurar y ejecutar el sistema en cualquier equipo local o servidor.

### 1. Requisitos Previos

* **Node.js**: Versión 18.x o superior instalada ([Descargar Node.js](https://nodejs.org/)).
* **Docker Desktop**: Recomendado para ejecutar la base de datos MariaDB en contenedor ([Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)).
* **Git**: Para clonar el repositorio de forma ágil ([Descargar Git](https://git-scm.com/)).

---

### Paso 1: Clonar o Descargar el Proyecto

Abre tu terminal (PowerShell, Bash o CMD) y descarga el repositorio:

```bash
git clone https://github.com/usuario/sistema-asistencias-cei-simon-diaz.git
cd "sistema-asistencias-cei-simon-diaz"
```

---

### Paso 2: Configuración de Variables de Entorno (`.env`)

El sistema incluye un archivo `.env` configurado por defecto con los parámetros óptimos de desarrollo:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=cei_simondiaz
DB_PORT=3306
JWT_SECRET=super_secret_jwt_key_cei_simondiaz_2026
```

> [!NOTE]
> Si el puerto `3306` ya se encuentra ocupado en tu equipo por otra instancia de MySQL, puedes cambiar el puerto en `.env` y en la sección `ports` de `docker-compose.yml` (por ejemplo a `3307:3306`).

---

### Paso 3: Despliegue de Base de Datos con Docker

Ejecuta el siguiente comando en la raíz del proyecto para descargar la imagen de MariaDB, levantar el contenedor y ejecutar de forma automática el script `init.sql`:

```bash
docker-compose up -d --build
```

Para verificar que el contenedor se encuentra en ejecución:

```bash
docker ps
```

---

### Paso 4: Instalación de Dependencias Node.js

Descarga e instala las librerías necesarias del proyecto:

```bash
npm install
```

---

### Paso 5: Ejecución del Servidor Web

Inicia la aplicación Express ejecutando:

```bash
npm start
```
*(O de forma alternativa: `node server.js`)*

Una vez iniciado, la terminal confirmará:
```text
==================================================
🚀 Servidor C.E.I. Simón Díaz en ejecución
🌐 Acceso local: http://localhost:3000
==================================================
✅ [MariaDB] Conexión establecida con éxito mediante mysql-tab en el puerto 3306
```

Abre tu navegador web e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Credenciales de Acceso por Defecto

Para iniciar sesión por primera vez en el sistema, utiliza las siguientes credenciales de superadministrador:

| Campo | Valor de Acceso |
| :--- | :--- |
| **Usuario** | `admin` *(o `admin@gmail.com`)* |
| **Contraseña** | `admin123` *(o `admin`)* |
| **Rol Asignado** | Administrador del Plantel |

> [!TIP]
> Una vez dentro del sistema, puedes hacer clic en el nombre del Administrador (en la esquina superior derecha) para cambiar tu nombre, correo, usuario, contraseña o cargar tu propia fotografía de perfil.

---

## 🛡️ Arquitectura de Resiliencia y Alta Disponibilidad

El sistema implementa en `config/db.js` un patrón de **resiliencia de alta disponibilidad**:
* Si el contenedor de MariaDB está activo, el sistema se conecta automáticamente y persiste toda la información en la base de datos relacional.
* Si por razones técnicas Docker no estuviese disponible temporalmente en la máquina del usuario, el sistema conmuta de manera transparente a un almacén de memoria controlado, garantizando que el usuario pueda visualizar la interfaz, navegar entre pantallas, interactuar con modales y probar la exportación de reportes sin interrupciones.
