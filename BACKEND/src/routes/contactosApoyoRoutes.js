// src/routes/contactosApoyoRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/contactosApoyoController");

router.get("/aceptar/:token", (req, res) => {
  const { token } = req.params;
  return res.redirect(`http:/192.168.100.4:3030/aceptar-invitacion/${token}`);
});

router.post("/invitar", controller.invitarContacto);
router.post("/aceptar/:token", controller.aceptarInvitacion);
router.post("/rechazar/:token", controller.rechazarInvitacion);
router.post("/vincular", controller.vincularInvitacion);
router.get("/verificar/:usuario_id", controller.verificarAcceso);
router.patch("/:id/habilitar", controller.habilitar);
router.patch("/:id/prioridad", controller.cambiarPrioridad);
router.get("/mis-contactos/:usuario_id", controller.verContactos);
router.delete("/mis-contactos/:contacto_id", controller.eliminarContacto);
router.put("/mis-contactos/:contacto_id", controller.editarContacto);
router.get("/invitaciones/:usuario_id", controller.verInvitacionesEnviadas);


module.exports = router;
