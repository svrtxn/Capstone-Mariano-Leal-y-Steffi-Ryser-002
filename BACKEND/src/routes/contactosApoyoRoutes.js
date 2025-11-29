// src/routes/contactosApoyoRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/contactosApoyoController");

// ======================================================
//     Ruta GET cuando el usuario hace clic en el correo
// ======================================================
router.get("/aceptar/:token", (req, res) => {
  const { token } = req.params;
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
router.post("/vincular", controller.vincularInvitacion);

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
//     🆕 H. Ver mis contactos de apoyo (del paciente)
// ======================================================
router.get("/mis-contactos/:usuario_id", controller.verContactos);

// ======================================================
//     🆕 I. Eliminar contacto de apoyo
// ======================================================
router.delete("/mis-contactos/:contacto_id", controller.eliminarContacto);


// ======================================================
//     🆕 J. Editar contacto de apoyo
// ======================================================
router.put("/mis-contactos/:contacto_id", controller.editarContacto);

// K. Ver todas las invitaciones enviadas
router.get("/invitaciones/:usuario_id", controller.verInvitacionesEnviadas);


module.exports = router;
