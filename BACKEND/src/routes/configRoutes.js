const express = require("express");
const router = express.Router();
const controller = require("../controllers/configController");

router.post("/:usuarioId", controller.createConfig);
router.get("/:usuarioId", controller.getConfig);
router.put("/:usuarioId", controller.updateConfig);

module.exports = router;
