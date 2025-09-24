const express = require('express');

const router = express.Router();

router.get('/', function(req, res) {
    res.send('Ruta de usuarios');
});

module.exports = router;