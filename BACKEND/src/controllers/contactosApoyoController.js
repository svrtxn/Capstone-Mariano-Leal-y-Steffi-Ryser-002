const { v4: uuidv4 } = require("uuid");
const contactosModel = require("../models/contactosApoyoModel");
const usuariosModel = require("../models/usuarioModel");
const sendEmail = require("../utils/sendEmail");

module.exports = {
  // =====================================================
  // A. Crear invitación
  // =====================================================
  async invitarContacto(req, res) {
    try {
      const {
        usuario_id,
        nombre_contacto,
        email_contacto,
        telefono_contacto,
        tipo_contacto,
      } = req.body;

      const paciente = await usuariosModel.obtenerPorId(usuario_id);
      if (!paciente) {
        return res.status(404).json({ msg: "Paciente no existe" });
      }

      let contacto_usuario_id = null;

      const existe = await usuariosModel.obtenerPorEmail(email_contacto);
      if (existe) contacto_usuario_id = existe.usuario_id;

      const token = uuidv4();

      const contacto_id = await contactosModel.crearInvitacion({
        usuario_id,
        contacto_usuario_id,
        nombre_contacto,
        email_contacto,
        telefono_contacto,
        tipo_contacto,
        token_invitacion: token,
      });

      // ------------------------
      // Enviar correo Ethereal
      // ------------------------
      const { previewURL } = await sendEmail(
        email_contacto,
        "Invitación de Apoyo — GlucoGuard",
        `
        <div style="font-family: Arial, sans-serif; background-color:#f6f7f9; padding:30px;">
          <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">

            <div style="background:#3DB7C4; padding:25px; text-align:center;">
              <img src="https://i.postimg.cc/jS9NsK9D/glucoguard-text-white.png" alt="GlucoGuard" style="width:120px; margin-bottom:10px;" />
              <h1 style="color:white; margin:0; font-size:22px; font-weight:600;">
                Invitación para ser Contacto de Apoyo
              </h1>
            </div>

            <div style="padding:30px; font-size:15px; color:#333; line-height:1.6;">
              <p>Hola <b>${nombre_contacto}</b>,</p>

              <p>
                Has sido invitado por <b>${paciente.nombre}</b> para ser su contacto de apoyo en <b>GlucoGuard</b>.
                Podrás ayudarlo supervisando sus niveles de glucosa de manera segura.
              </p>

              <div style="text-align:center; margin:30px 0;">
                <a href="http://localhost:8080/contactos-apoyo/aceptar/${token}"
                  style="
                    background:#3DB7C4;
                    color:white;
                    padding:14px 24px;
                    border-radius:8px;
                    text-decoration:none;
                    font-size:16px;
                    font-weight:bold;
                    display:inline-block;
                  "
                >
                  Aceptar Invitación
                </a>
              </div>

              <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>

              <p style="margin-top:30px;">
                Saludos,<br>
                <b>Equipo GlucoGuard</b>
              </p>
            </div>

          </div>
        </div>
        `
      );

      // 🔥 Ahora también mandamos previewURL al front
      res.json({
        msg: "Invitación enviada",
        contacto_id,
        token,
        previewURL,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "Error interno" });
    }
  },

  // =====================================================
  // B. Aceptar invitación (token por params)
  // =====================================================
  async aceptarInvitacion(req, res) {
  try {
    const { token } = req.params;
    console.log("TOKEN QUE LLEGA:", token);

    const invitacion = await contactosModel.buscarPorToken(token);
    console.log("INVITACION ENCONTRADA:", invitacion);

    if (!invitacion) {
      return res.status(404).json({ error: "Token inválido o expirado" });
    }

    // OJO: todavía NO cambiamos estado acá, lo haremos al vincular al usuario
    // await contactosModel.actualizarEstado(token, "aceptada");

    return res.json({
      ok: true,
      invitacion: {
        token,
        contacto_id: invitacion.id,           // ajusta al nombre real de PK
        nombre_contacto: invitacion.nombre_contacto,
        email_contacto: invitacion.email_contacto,
        paciente_id: invitacion.usuario_id,   // el paciente que invitó
      },
    });
  } catch (err) {
    console.error("Error al aceptar invitación:", err);
    return res.status(500).json({ error: "Error interno" });
  }
},

  // =====================================================
  // C. Rechazar invitación
  // =====================================================
  async rechazarInvitacion(req, res) {
    try {
      const { token } = req.params;

      await contactosModel.rechazarInvitacion(token);

      res.json({ msg: "Invitación rechazada" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "Error interno" });
    }
  },
    // =====================================================
  // C. VINCULAR CUENTAS
  // =====================================================
  async vincularInvitacion(req, res) {
    try {
      const { token, contacto_usuario_id } = req.body;

      if (!token || !contacto_usuario_id) {
        return res
          .status(400)
          .json({ msg: "Faltan datos: token o contacto_usuario_id" });
      }

      const resultado = await contactosModel.aceptarInvitacion(
        token,
        contacto_usuario_id
      );

      if (resultado.affectedRows === 0) {
        return res
          .status(404)
          .json({ msg: "Invitación no encontrada o ya utilizada" });
      }

      return res.json({ msg: "Invitación aceptada y vinculada correctamente" });
    } catch (err) {
      console.error("Error al vincular invitación:", err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },
  // =====================================================
  // D. Verificar acceso
  // =====================================================
  async verificarAcceso(req, res) {
    try {
      const { usuario_id } = req.params; // paciente
      const { contacto_usuario_id } = req.query; // contacto

      const acceso = await contactosModel.verificarAcceso(
        usuario_id,
        contacto_usuario_id
      );

      if (!acceso) {
        return res.status(403).json({
          msg: "No tienes permiso para ver la glucosa de este paciente",
        });
      }

      res.json({ msg: "Acceso permitido" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "Error interno" });
    }
  },

  // =====================================================
  // F. Habilitar / Deshabilitar
  // =====================================================
  async habilitar(req, res) {
    const { id } = req.params;
    const { habilitado } = req.body;

    await contactosModel.habilitar(id, habilitado);
    res.json({ msg: "Estado actualizado" });
  },

  // =====================================================
  // F2. Cambiar prioridad
  // =====================================================
  async cambiarPrioridad(req, res) {
    const { id } = req.params;
    const { prioridad } = req.body;

    await contactosModel.cambiarPrioridad(id, prioridad);
    res.json({ msg: "Prioridad cambiada" });
  },

  // =====================================================
  // G. Mis pacientes
  // =====================================================
  async misPacientes(req, res) {
    try {
      const { contacto_usuario_id } = req.body;

      const pacientes = await contactosModel.misPacientes(contacto_usuario_id);

      res.json(pacientes);
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "Error interno" });
    }
  },
};
