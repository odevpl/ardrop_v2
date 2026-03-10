const nodemailer = require("nodemailer");

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "mail48.mydevil.net",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

const sendMail = async ({ template }) => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    const error = new Error("Mail service is not configured (missing EMAIL/EMAIL_PASSWORD)");
    error.status = 500;
    throw error;
  }

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail(template);
    return { messageId: info.messageId };
  } catch (err) {
    // Keep this concise but actionable for SMTP debugging in production logs.
    console.error("[mail] send failed", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
      host: process.env.EMAIL_HOST || "mail48.mydevil.net",
      port: Number(process.env.EMAIL_PORT || 587),
      user: process.env.EMAIL,
      to: template?.to,
      subject: template?.subject,
    });

    const error = new Error("Mail delivery failed");
    error.status = 502;
    throw error;
  }
};

module.exports = {
  sendMail,
};
