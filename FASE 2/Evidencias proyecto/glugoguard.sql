-- ----------------------------------------------------------------------------
-- GlucoGuard - Esquema completo 
-- ----------------------------------------------------------------------------

DROP DATABASE IF EXISTS glucoguard;
CREATE DATABASE IF NOT EXISTS glucoguard
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_unicode_ci;
USE glucoguard;

-- ---------------------------------------------------------------------------
-- Tabla: Usuarios
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS Usuarios;
CREATE TABLE Usuarios (
    usuario_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
        COMMENT 'Identificador único del usuario',
    nombre VARCHAR(50) NOT NULL COMMENT 'Nombre del usuario',
    apellido VARCHAR(50) NOT NULL COMMENT 'Apellido del usuario',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Correo electrónico único del usuario',
    contraseña VARCHAR(255) NOT NULL COMMENT 'Contraseña en formato hash',
    fecha_nacimiento DATE NULL COMMENT 'Fecha de nacimiento del usuario',
    rol ENUM('paciente','amigo','medico','admin') NOT NULL DEFAULT 'paciente' COMMENT 'Rol del usuario',
    telefono VARCHAR(20) NULL COMMENT 'Teléfono del usuario',
    ultimo_login DATETIME NULL COMMENT 'Última fecha/hora de login',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios registrados en GlucoGuard';

-- ---------------------------------------------------------------------------
-- Tabla: NivelesGlucosa
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS NivelesGlucosa;
CREATE TABLE NivelesGlucosa (
    glucosa_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
        COMMENT 'Identificador único de la medición de glucosa',
    usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario dueño de la medición',
    valor_glucosa DECIMAL(6,2) NOT NULL COMMENT 'Valor de glucosa en mg/dL',
    unidad VARCHAR(10) NOT NULL DEFAULT 'mg/dL' COMMENT 'Unidad de medición',
    metodo_registro ENUM('manual','sensor') NOT NULL DEFAULT 'manual' COMMENT 'Método de registro',
    origen_sensor VARCHAR(100) NULL COMMENT 'Identificador del sensor (si aplica)',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro',
    etiquetado ENUM('antes_comida','despues_comida','ayuno','otro') NULL COMMENT 'Etiqueta contextual',
    notas VARCHAR(255) NULL COMMENT 'Notas adicionales',
    registrado_por INT UNSIGNED NULL COMMENT 'Si un tercero registró la medición',
    INDEX idx_glucosa_usuario_fecha (usuario_id, fecha_registro),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES Usuarios(usuario_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de mediciones de glucosa';

-- ---------------------------------------------------------------------------
-- Tabla: Alertas
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS Alertas;
CREATE TABLE Alertas (
    alerta_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID de alerta',
    usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario dueño de la alerta',
    tipo_alerta ENUM('hipoglucemia','hiperglucemia','recordatorio','otro') NOT NULL COMMENT 'Tipo de alerta',
    valor_disparador DECIMAL(6,2) NULL COMMENT 'Valor que dispara alerta',
    comparador ENUM('<','>','<=','>=','=','between') NULL COMMENT 'Comparador de condición',
    estado ENUM('activa','inactiva','enviada','suspendida') NOT NULL DEFAULT 'activa' COMMENT 'Estado de alerta',
    canal ENUM('sms','email','push','llamada') NOT NULL DEFAULT 'push' COMMENT 'Canal de envío',
    prioridad TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Prioridad de alerta',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_envio DATETIME NULL COMMENT 'Fecha de envío',
    activo_desde DATETIME NULL COMMENT 'Inicio de ventana activa',
    activo_hasta DATETIME NULL COMMENT 'Fin de ventana activa',
    INDEX idx_alertas_usuario_estado (usuario_id, estado),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuración y registro de alertas críticas';

-- ---------------------------------------------------------------------------
-- Tabla: Configuraciones
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS Configuraciones;
CREATE TABLE Configuraciones (
    config_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID de configuración',
    usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario dueño de la configuración',
    rango_minimo DECIMAL(6,2) NOT NULL DEFAULT 70.00 COMMENT 'Valor mínimo de glucosa',
    rango_maximo DECIMAL(6,2) NOT NULL DEFAULT 180.00 COMMENT 'Valor máximo de glucosa',
    frecuencia_medicion INT UNSIGNED NOT NULL DEFAULT 240 COMMENT 'Frecuencia en minutos',
    notificaciones BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Recibir notificaciones',
    zona_horaria VARCHAR(100) NOT NULL DEFAULT "America/Santiago" COMMENT 'Zona horaria del usuario',
    idioma VARCHAR(10) NOT NULL DEFAULT 'es' COMMENT 'Idioma preferido',
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    UNIQUE KEY uq_config_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Preferencias de configuración de cada usuario';

-- ---------------------------------------------------------------------------
-- Tabla: ContactosApoyo
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS ContactosApoyo;
CREATE TABLE ContactosApoyo (
    contacto_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID del contacto',
    usuario_id INT UNSIGNED NOT NULL COMMENT 'Usuario paciente dueño del contacto',
    contacto_usuario_id INT UNSIGNED NULL COMMENT 'Usuario contacto registrado',
    nombre_contacto VARCHAR(100) NULL COMMENT 'Nombre si es externo',
    email_contacto VARCHAR(100) NULL COMMENT 'Email si es externo',
    telefono_contacto VARCHAR(20) NULL COMMENT 'Teléfono si es externo',
    tipo_contacto ENUM('amigo','medico','familiar','otro') NOT NULL DEFAULT 'amigo' COMMENT 'Tipo de contacto',
    prioridad TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Prioridad',
    habilitado BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Habilitado para alertas',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    INDEX idx_contacto_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (contacto_usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Contactos de apoyo para recibir alertas';

-- ---------------------------------------------------------------------------
-- Tabla: HistorialEventos
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS HistorialEventos;
CREATE TABLE HistorialEventos (
    evento_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID de evento',
    usuario_id INT UNSIGNED NULL COMMENT 'Usuario relacionado (nullable)',
    tipo_evento ENUM('registro_glucosa','alerta_enviada','config_actualizada','login','registro_usuario','otro') NOT NULL COMMENT 'Tipo de evento',
    descripcion TEXT NULL COMMENT 'Descripción del evento',
    metadata JSON NULL COMMENT 'Metadatos opcionales en JSON',
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
    INDEX idx_evento_usuario_fecha (usuario_id, fecha_evento),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de eventos de la aplicación';

-- ---------------------------------------------------------------------------
-- Tabla: Educacion
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS Educacion;
CREATE TABLE Educacion (
    contenido_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID de contenido educativo',
    titulo VARCHAR(150) NOT NULL COMMENT 'Título del contenido',
    descripcion TEXT NOT NULL COMMENT 'Descripción del contenido',
    tipo ENUM('articulo','video','tip','infografia') NOT NULL DEFAULT 'articulo' COMMENT 'Tipo de recurso',
    url VARCHAR(255) NULL COMMENT 'Enlace externo',
    fuente VARCHAR(255) NULL COMMENT 'Fuente o autor',
    publicado BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si está publicado',
    fecha_publicacion DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT 'Fecha de publicación',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Contenido educativo sobre diabetes y glucosa';