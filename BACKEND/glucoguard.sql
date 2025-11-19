-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-11-2025 a las 21:55:22
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `glucoguard`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `alerta_id` int(10) UNSIGNED NOT NULL COMMENT 'ID de alerta',
  `usuario_id` int(10) UNSIGNED NOT NULL COMMENT 'Usuario dueño de la alerta',
  `tipo_alerta` varchar(255) DEFAULT NULL,
  `valor_disparador` decimal(6,2) DEFAULT NULL COMMENT 'Valor que dispara alerta',
  `comparador` enum('<','>','<=','>=','=','between') DEFAULT NULL COMMENT 'Comparador de condición',
  `estado` enum('activa','inactiva','enviada','suspendida') NOT NULL DEFAULT 'activa' COMMENT 'Estado de alerta',
  `canal` enum('sms','email','push','llamada') NOT NULL DEFAULT 'push' COMMENT 'Canal de envío',
  `prioridad` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Prioridad de alerta',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación',
  `fecha_envio` datetime DEFAULT NULL COMMENT 'Fecha de envío',
  `activo_desde` datetime DEFAULT NULL COMMENT 'Inicio de ventana activa',
  `activo_hasta` datetime DEFAULT NULL COMMENT 'Fin de ventana activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración y registro de alertas críticas';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones`
--

CREATE TABLE `configuraciones` (
  `config_id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `hipo_min` int(11) DEFAULT 70 COMMENT 'Bajo este valor: hipoglucemia',
  `normal_min` int(11) DEFAULT 70 COMMENT 'Inicio intervalo normal',
  `normal_max` int(11) DEFAULT 140 COMMENT 'Fin intervalo normal',
  `hiper_max` int(11) DEFAULT 140 COMMENT 'Sobre este valor: hiperglucemia',
  `frecuencia_medicion` int(10) UNSIGNED NOT NULL DEFAULT 240 COMMENT 'Frecuencia en minutos',
  `notificaciones` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Recibir notificaciones',
  `zona_horaria` varchar(100) NOT NULL DEFAULT 'America/Santiago' COMMENT 'Zona horaria del usuario',
  `idioma` varchar(10) NOT NULL DEFAULT 'es' COMMENT 'Idioma preferido',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Preferencias de configuración y umbrales personalizados por usuario';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactosapoyo`
--

CREATE TABLE `contactosapoyo` (
  `contacto_id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `contacto_usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `nombre_contacto` varchar(100) DEFAULT NULL,
  `email_contacto` varchar(100) DEFAULT NULL,
  `telefono_contacto` varchar(20) DEFAULT NULL,
  `tipo_contacto` enum('amigo','medico','familiar','otro') NOT NULL DEFAULT 'amigo',
  `prioridad` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `habilitado` tinyint(1) NOT NULL DEFAULT 1,
  `estado_invitacion` enum('pendiente','aceptada','rechazada','expirada') NOT NULL DEFAULT 'pendiente',
  `token_invitacion` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `educacion`
--

CREATE TABLE `educacion` (
  `contenido_id` int(10) UNSIGNED NOT NULL COMMENT 'ID de contenido educativo',
  `titulo` varchar(150) NOT NULL COMMENT 'Título del contenido',
  `descripcion` text NOT NULL COMMENT 'Descripción del contenido',
  `tipo` enum('articulo','video','tip','infografia') NOT NULL DEFAULT 'articulo' COMMENT 'Tipo de recurso',
  `url` varchar(255) DEFAULT NULL COMMENT 'Enlace externo',
  `fuente` varchar(255) DEFAULT NULL COMMENT 'Fuente o autor',
  `publicado` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si está publicado',
  `fecha_publicacion` date NOT NULL DEFAULT curdate() COMMENT 'Fecha de publicación',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Contenido educativo sobre diabetes y glucosa';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historialeventos`
--

CREATE TABLE `historialeventos` (
  `evento_id` bigint(20) UNSIGNED NOT NULL COMMENT 'ID de evento',
  `usuario_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Usuario relacionado (nullable)',
  `tipo_evento` enum('registro_glucosa','alerta_enviada','config_actualizada','login','registro_usuario','otro') NOT NULL COMMENT 'Tipo de evento',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del evento',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Metadatos opcionales en JSON' CHECK (json_valid(`metadata`)),
  `fecha_evento` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora del evento'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de eventos de la aplicación';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nivelesglucosa`
--

CREATE TABLE `nivelesglucosa` (
  `glucosa_id` int(10) UNSIGNED NOT NULL COMMENT 'Identificador único de la medición de glucosa',
  `usuario_id` int(10) UNSIGNED NOT NULL COMMENT 'Usuario dueño de la medición',
  `valor_glucosa` decimal(6,2) NOT NULL COMMENT 'Valor de glucosa en mg/dL',
  `estado_glucosa` enum('hipo','normal','hiper','fuera_rango') DEFAULT NULL,
  `unidad` varchar(10) NOT NULL DEFAULT 'mg/dL' COMMENT 'Unidad de medición',
  `metodo_registro` enum('manual','sensor') NOT NULL DEFAULT 'manual' COMMENT 'Método de registro',
  `origen_sensor` varchar(100) DEFAULT NULL COMMENT 'Identificador del sensor (si aplica)',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro',
  `etiquetado` enum('antes_comida','despues_comida','ayuno','otro') DEFAULT NULL COMMENT 'Etiqueta contextual',
  `notas` varchar(255) DEFAULT NULL COMMENT 'Notas adicionales',
  `registrado_por` int(10) UNSIGNED DEFAULT NULL COMMENT 'Si un tercero registró la medición'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de mediciones de glucosa';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `usuario_id` int(10) UNSIGNED NOT NULL COMMENT 'Identificador único del usuario',
  `nombre` varchar(50) NOT NULL COMMENT 'Nombre del usuario',
  `apellido` varchar(50) NOT NULL COMMENT 'Apellido del usuario',
  `email` varchar(100) NOT NULL COMMENT 'Correo electrónico único del usuario',
  `contraseña` varchar(255) NOT NULL COMMENT 'Contraseña en formato hash',
  `fecha_nacimiento` date DEFAULT NULL COMMENT 'Fecha de nacimiento del usuario',
  `rol` enum('paciente','amigo','medico','admin') NOT NULL DEFAULT 'paciente' COMMENT 'Rol del usuario',
  `telefono` varchar(20) DEFAULT NULL COMMENT 'Teléfono del usuario',
  `ultimo_login` datetime DEFAULT NULL COMMENT 'Última fecha/hora de login',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación del registro',
  `tiene_sensor` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el usuario tiene sensor (1: sí, 0: no)',
  `resetToken` varchar(255) DEFAULT NULL,
  `resetExpires` bigint(20) DEFAULT NULL,
  `tipo_diabetes` enum('tipo1','tipo2') DEFAULT NULL COMMENT 'Tipo de diabetes del usuario',
  `contrasena_librelink` varchar(255) DEFAULT NULL COMMENT 'Contraseña en texto plano para LibreLink (solo para login externo)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios registrados en GlucoGuard';

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`alerta_id`),
  ADD KEY `idx_alertas_usuario_estado` (`usuario_id`,`estado`);

--
-- Indices de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  ADD PRIMARY KEY (`config_id`),
  ADD UNIQUE KEY `uq_config_usuario` (`usuario_id`);

--
-- Indices de la tabla `contactosapoyo`
--
ALTER TABLE `contactosapoyo`
  ADD PRIMARY KEY (`contacto_id`);

--
-- Indices de la tabla `educacion`
--
ALTER TABLE `educacion`
  ADD PRIMARY KEY (`contenido_id`);

--
-- Indices de la tabla `historialeventos`
--
ALTER TABLE `historialeventos`
  ADD PRIMARY KEY (`evento_id`),
  ADD KEY `idx_evento_usuario_fecha` (`usuario_id`,`fecha_evento`);

--
-- Indices de la tabla `nivelesglucosa`
--
ALTER TABLE `nivelesglucosa`
  ADD PRIMARY KEY (`glucosa_id`),
  ADD KEY `idx_glucosa_usuario_fecha` (`usuario_id`,`fecha_registro`),
  ADD KEY `registrado_por` (`registrado_por`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`usuario_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_usuario_rol` (`rol`),
  ADD KEY `idx_usuario_email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `alerta_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID de alerta', AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  MODIFY `config_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `contactosapoyo`
--
ALTER TABLE `contactosapoyo`
  MODIFY `contacto_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `educacion`
--
ALTER TABLE `educacion`
  MODIFY `contenido_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID de contenido educativo';

--
-- AUTO_INCREMENT de la tabla `historialeventos`
--
ALTER TABLE `historialeventos`
  MODIFY `evento_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID de evento';

--
-- AUTO_INCREMENT de la tabla `nivelesglucosa`
--
ALTER TABLE `nivelesglucosa`
  MODIFY `glucosa_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la medición de glucosa', AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `usuario_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del usuario', AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD CONSTRAINT `alertas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  ADD CONSTRAINT `fk_config_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `historialeventos`
--
ALTER TABLE `historialeventos`
  ADD CONSTRAINT `historialeventos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `nivelesglucosa`
--
ALTER TABLE `nivelesglucosa`
  ADD CONSTRAINT `nivelesglucosa_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `nivelesglucosa_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`usuario_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
