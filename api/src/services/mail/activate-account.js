const { sendMail } = require("./index");

const getFrontendUrl = () => process.env.CLIENT_APP_URL || "http://localhost:3003";

const activateAccountTemplate = async ({ email, token }) => {
  const activationLink = `${getFrontendUrl().replace(/\/+$/, "")}/activate?token=${encodeURIComponent(token)}`;
  const template = {
    from: `"Ardrop.pl" <${process.env.EMAIL}>`,
    to: email,
    subject: "Aktywacja konta",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2>Aktywacja konta</h2>
        <p>Dziekujemy za rejestracje. Kliknij ponizszy przycisk, aby aktywowac konto.</p>
        <p><a href="${activationLink}" style="background:#0a64c9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Aktywuj konto</a></p>
        <p>Link wygasa za 60 minut.</p>
      </div>
    `,
  };

  return sendMail({ template });
};

module.exports = {
  activateAccountTemplate,
};
