// src/routes/contactosApoyoRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/contactosApoyoController");

// ======================================================
//     Ruta GET para cuando el usuario hace clic
//     en el correo (evita el error Cannot GET ...)
// ======================================================
router.get("/aceptar/:token", (req, res) => {
  const { token } = req.params;

  // Cambia esta URL por la de tu FRONTEND
  return res.redirect(`http://localhost:8081/aceptar-invitacion/${token}`);
});

// ======================================================
//     A. Crear invitación
// ======================================================
router.post("/invitar", controller.invitarContacto);

// ======================================================
//     B. Aceptar o rechazar (token por params)
// ======================================================
router.post("/aceptar/:token", controller.aceptarInvitacion);
router.post("/rechazar/:token", controller.rechazarInvitacion);

// ======================================================
//     D. Verificar acceso
// ======================================================
router.get("/verificar/:usuario_id", controller.verificarAcceso);

// ======================================================
//     F. Habilitar contacto
// ======================================================
router.patch("/:id/habilitar", controller.habilitar);

// ======================================================
//     F2. Cambiar prioridad
// ======================================================
router.patch("/:id/prioridad", controller.cambiarPrioridad);

// ======================================================
//     G. Mis pacientes
// ======================================================
router.post("/mis-pacientes", controller.misPacientes);

module.exports = router;
