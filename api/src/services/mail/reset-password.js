const { sendMail } = require("./index");

const getFrontendUrl = () => process.env.CLIENT_APP_URL || "http://localhost:3003";

const resetPasswordTemplate = async ({ email, token }) => {
  const resetLink = `${getFrontendUrl().replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const template = {
    from: `"Ardrop.pl" <${process.env.EMAIL}>`,
    to: email,
    subject: "Reset hasla",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2>Reset hasla</h2>
        <p>Otrzymalismy prosbe o zmiane hasla. Kliknij ponizszy przycisk, aby ustawic nowe haslo.</p>
        <p><a href="${resetLink}" style="background:#0a64c9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Ustaw nowe haslo</a></p>
        <p>Link wygasa za 60 minut.</p>
      </div>
    `,
  };

  return sendMail({ template });
};

module.exports = {
  resetPasswordTemplate,
};
