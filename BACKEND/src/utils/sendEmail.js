const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
  try {
    // Crear cuenta de prueba de Ethereal
    let testAccount = await nodemailer.createTestAccount();

    // Transporter de Ethereal
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await transporter.sendMail({
      from: '"GlucoGuard" soporte@glucoguard.cl',
      to,
      subject,
      html
    });

    const previewURL = nodemailer.getTestMessageUrl(info);

    return { info, previewURL };

  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

module.exports = sendEmail;