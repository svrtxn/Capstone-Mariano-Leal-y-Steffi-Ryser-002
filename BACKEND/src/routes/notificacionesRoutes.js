const express = require("express");
const router = express.Router();
const notificacionesController = require("../controllers/notificacionesController");

router.post("/registrar-token", notificacionesController.registrarExpoToken);

module.exports = router;
