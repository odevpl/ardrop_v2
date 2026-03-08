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
    return { skipped: true, reason: "Missing EMAIL/EMAIL_PASSWORD" };
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail(template);
  return { messageId: info.messageId };
};

module.exports = {
  sendMail,
};
