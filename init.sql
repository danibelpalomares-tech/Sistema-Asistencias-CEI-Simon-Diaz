-- Base de Datos para el Sistema de Asistencia C.E.I. Simón Díaz
CREATE DATABASE IF NOT EXISTS `cei_simondiaz` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cei_simondiaz`;

-- 1. Tabla de Usuarios (Administradores del Sistema)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `usuario` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) DEFAULT 'Administrador',
  `foto` VARCHAR(255) DEFAULT '/uploads/admin/default-admin.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Empleados
CREATE TABLE IF NOT EXISTS `empleados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo_cedula` VARCHAR(2) DEFAULT 'V',
  `cedula` VARCHAR(20) NOT NULL UNIQUE,
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `genero` VARCHAR(20) NOT NULL,
  `fecha_nacimiento` DATE,
  `telefono` VARCHAR(30),
  `email` VARCHAR(150),
  `direccion` TEXT,
  `cargo` VARCHAR(100) NOT NULL,
  `estado` VARCHAR(20) DEFAULT 'Activo',
  `nivel_academico` VARCHAR(100),
  `fecha_ingreso` DATE,
  `foto` VARCHAR(255) DEFAULT '/public/assets/default-avatar.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Asistencias (Entrada y Salida)
CREATE TABLE IF NOT EXISTS `asistencias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_empleado` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_entrada` TIME,
  `hora_salida` TIME,
  `estado` VARCHAR(50) DEFAULT 'Presente',
  `observaciones` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Permisos
CREATE TABLE IF NOT EXISTS `permisos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_empleado` INT NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `motivo` TEXT,
  `archivo_adjunto` VARCHAR(255),
  `estado` VARCHAR(50) DEFAULT 'Aprobado',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Configuración
CREATE TABLE IF NOT EXISTS `configuracion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(50) UNIQUE NOT NULL,
  `valor` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto (password: 'admin123' / hash SHA-256)
INSERT INTO `usuarios` (`nombre`, `email`, `usuario`, `password`, `rol`, `foto`)
VALUES ('Administrador', 'admin@gmail.com', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador', '/uploads/admin/default-admin.png')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- Configuración inicial del sistema
INSERT INTO `configuracion` (`clave`, `valor`) VALUES 
('admin_nombre', 'Administrador'),
('admin_titulo', 'Administrador'),
('admin_email', 'admin@gmail.com'),
('admin_foto', '/uploads/admin/default-admin.png')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);
