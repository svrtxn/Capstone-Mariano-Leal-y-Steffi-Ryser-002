const db = require('../../BD/mysql');

// REGISTRO DE GLUCOSA
exports.registrarGlucosa = async (req, res) => {
     console.log('REQ.BODY:', req.body);
    try {
        const {
            usuario_id,
            valor_glucosa,
            unidad,
            metodo_registro,
            origen_sensor,
            fecha_registro,
            etiquetado,
            notas,
            registrado_por
        } = req.body;

        if (!usuario_id || !valor_glucosa) {
            return res.status(400).json({ mensaje: "usuario_id y valor_glucosa son obligatorios" });
        }

        const query = `
            INSERT INTO nivelesglucosa 
            (usuario_id, valor_glucosa, unidad, metodo_registro, origen_sensor, fecha_registro, etiquetado, notas, registrado_por) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            usuario_id,
            valor_glucosa,
            unidad || 'mg/dL',
            metodo_registro || null,
            origen_sensor || null,
            fecha_registro || new Date(),
            etiquetado || null,
            notas || null,
            registrado_por || null
        ]);

        res.status(201).json({ 
            mensaje: "Medición de glucosa registrada correctamente",
            glucosa_id: result.insertId
        });
    } catch (error) {
    console.error('ERROR EN REGISTRAR GLUCOSA:', error);
        res.status(500).json({
            mensaje: "Error al registrar la glucosa",
            error: error.message  // Esto muestra el mensaje real en Postman
        });
    }

};
