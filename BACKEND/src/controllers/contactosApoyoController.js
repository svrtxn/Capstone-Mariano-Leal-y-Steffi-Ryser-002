// src/controllers/contactosApoyoController.js
const { v4: uuidv4 } = require("uuid");
const contactosModel = require("../models/contactosApoyoModel");
const usuariosModel = require("../models/usuarioModel");
const sendEmail = require("../utils/sendEmail");

module.exports = {
  // Invitación de contacto de apoyo
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

      // Enviar correo Ethereal
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
                <a href="http://172.20.10.2:8081/aceptar-invitacion/${token}"
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

  // Aceptar invitación (token por params) → sólo valida y devuelve datos
  async aceptarInvitacion(req, res) {
    try {
      const { token } = req.params;
      console.log("TOKEN QUE LLEGA:", token);

      const invitacion = await contactosModel.buscarPorToken(token);
      console.log("INVITACION ENCONTRADA:", invitacion);

      if (!invitacion) {
        return res.status(404).json({ error: "Token inválido o expirado" });
      }

      return res.json({
        ok: true,
        invitacion: {
          token,
          contacto_id: invitacion.contacto_id,
          nombre_contacto: invitacion.nombre_contacto,
          email_contacto: invitacion.email_contacto,
          paciente_id: invitacion.usuario_id, // el paciente que invitó
        },
      });
    } catch (err) {
      console.error("Error al aceptar invitación:", err);
      return res.status(500).json({ error: "Error interno" });
    }
  },

  // Rechazar invitación
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

  // VINCULAR CUENTAS DE PACIENTE Y CONTACTO
  async vincularInvitacion(req, res) {
    try {
      const { token, contacto_usuario_id } = req.body;
      console.log("BODY VINCULAR ===>", req.body);

      if (!token || !contacto_usuario_id) {
        return res
          .status(400)
          .json({ msg: "Faltan datos: token o contacto_usuario_id" });
      }

      const resultado = await contactosModel.aceptarInvitacion(
        token,
        contacto_usuario_id
      );

      console.log("RESULTADO UPDATE ===>", resultado);

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

  // 🔥 NUEVO: ver pacientes de un contacto de apoyo
  async misPacientes(req, res) {
    try {
      const { contacto_usuario_id } = req.body;

      if (!contacto_usuario_id) {
        return res
          .status(400)
          .json({ msg: "Falta contacto_usuario_id en el cuerpo de la petición" });
      }

      const pacientes = await contactosModel.verPacientes(contacto_usuario_id);

      return res.json(pacientes);
    } catch (err) {
      console.error("Error en misPacientes:", err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },

  // D. Verificar acceso
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

  //  Habilitar / Deshabilitar
  async habilitar(req, res) {
    const { id } = req.params;
    const { habilitado } = req.body;

    await contactosModel.habilitar(id, habilitado);
    res.json({ msg: "Estado actualizado" });
  },

  //  Cambiar prioridad
  async cambiarPrioridad(req, res) {
    const { id } = req.params;
    const { prioridad } = req.body;

    await contactosModel.cambiarPrioridad(id, prioridad);
    res.json({ msg: "Prioridad cambiada" });
  },

  //  Ver mis contactos de apoyo (como paciente)
  async verContactos(req, res) {
    try {
      const { usuario_id } = req.params;

      const contactos = await contactosModel.verContactos(usuario_id);

      return res.json(contactos);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },

  // Eliminar contacto de apoyo
  async eliminarContacto(req, res) {
    try {
      const { contacto_id } = req.params;

      const result = await contactosModel.eliminarContacto(contacto_id);

      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: "Contacto no encontrado" });
      }

      return res.json({ msg: "Contacto eliminado correctamente" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },

  //  Editar contacto
  async editarContacto(req, res) {
    try {
      const { contacto_id } = req.params;
      const {
        nombre_contacto,
        email_contacto,
        telefono_contacto,
        tipo_contacto,
        prioridad,
        habilitado,
      } = req.body;

      const result = await contactosModel.editarContacto(
        contacto_id,
        nombre_contacto,
        email_contacto,
        telefono_contacto,
        tipo_contacto,
        prioridad,
        habilitado
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: "Contacto no encontrado" });
      }

      return res.json({ msg: "Contacto actualizado correctamente" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },

  //  Ver todas las invitaciones enviadas por un paciente
  async verInvitacionesEnviadas(req, res) {
    try {
      const { usuario_id } = req.params;

      const invitaciones =
        await contactosModel.verInvitacionesEnviadas(usuario_id);

      return res.json(invitaciones);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Error interno" });
    }
  },
};
