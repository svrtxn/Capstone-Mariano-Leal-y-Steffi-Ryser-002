// const { admin } = require('../config/firebaseAdmin');

// async function authMiddleware(req, res, next) {
//   try {

//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ ok: false, mensaje: "Token no proporcionado" });
//     }

//     const token = authHeader.split(" ")[1];

//     // Verificar token con Firebase
//     const decoded = await admin.auth().verifyIdToken(token);

//     // Guardar datos del usuario en la request
//     req.usuario = {
//       id: decoded.uid,
//       email: decoded.email || null,
//     };

//     next(); // permitir pasar a la ruta protegida

//   } catch (error) {
//     console.error("Error autenticando token:", error);
//     return res.status(401).json({ ok: false, mensaje: "Token inválido" });
//   }
// }

// module.exports = authMiddleware;
