const express = require("express");
const db = require("../config/db");
const roleMiddleware = require("../middlewares/role.middleware");
const mailService = require("../services/mail");

const router = express.Router();

const FORM_NAME_PATTERN = /^[a-z0-9_-]{1,100}$/i;

const parsePage = (value, fallback) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return number;
};

const parseDataJson = (value) => {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatContactEmailHtml = ({ formName, data }) => {
  const rows = Object.entries(data || {})
    .map(
      ([key, value]) =>
        `<tr><th align="left" style="padding:6px 10px;border-bottom:1px solid #ddd;">${escapeHtml(key)}</th><td style="padding:6px 10px;border-bottom:1px solid #ddd;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
    <h2>Nowe zgloszenie z formularza: ${escapeHtml(formName)}</h2>
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>
  `;
};

router.post("/contact/:formName", async (req, res) => {
  const formName = String(req.params.formName || "").trim();
  if (!FORM_NAME_PATTERN.test(formName)) {
    return res.status(400).json({ error: "Invalid formName" });
  }

  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const [id] = await db("contact_forms").insert({
    formName,
    dataJson: JSON.stringify(payload),
  });

  if (process.env.CONTACT_FORM_EMAIL) {
    mailService
      .sendMail({
        template: {
          from: process.env.EMAIL,
          to: process.env.CONTACT_FORM_EMAIL,
          subject: `Nowe zgloszenie formularza: ${formName}`,
          html: formatContactEmailHtml({ formName, data: payload }),
        },
      })
      .catch((error) => {
        console.error("[contact] mail notification failed", {
          message: error?.message,
          formName,
          id,
        });
      });
  }

  return res.status(201).json({ id, formName });
});

router.get("/admin/forms", roleMiddleware("ADMIN"), async (req, res) => {
  const rows = await db("contact_forms")
    .select("formName")
    .count({ count: "id" })
    .max({ lastReceivedAt: "createdAt" })
    .groupBy("formName")
    .orderBy("lastReceivedAt", "desc");

  return res.status(200).json({
    data: rows.map((row) => ({
      formName: row.formName,
      count: Number(row.count || 0),
      lastReceivedAt: row.lastReceivedAt,
    })),
  });
});

router.get("/admin/forms/:formName", roleMiddleware("ADMIN"), async (req, res) => {
  const formName = String(req.params.formName || "").trim();
  if (!FORM_NAME_PATTERN.test(formName)) {
    return res.status(400).json({ error: "Invalid formName" });
  }

  const page = parsePage(req.query.page, 1);
  const limit = Math.min(parsePage(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;

  const [{ total }] = await db("contact_forms")
    .where({ formName })
    .count({ total: "id" });
  const rows = await db("contact_forms")
    .select("id", "formName", "dataJson", "createdAt")
    .where({ formName })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .offset(offset);

  const totalCount = Number(total || 0);

  return res.status(200).json({
    data: rows.map((row) => ({
      ...row,
      dataJson: parseDataJson(row.dataJson),
    })),
    meta: {
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    },
  });
});

router.get("/admin/forms/:formName/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const formName = String(req.params.formName || "").trim();
  const id = Number(req.params.id);

  if (!FORM_NAME_PATTERN.test(formName) || !Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const row = await db("contact_forms")
    .select("id", "formName", "dataJson", "createdAt")
    .where({ id, formName })
    .first();

  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.status(200).json({
    data: { ...row, dataJson: parseDataJson(row.dataJson) },
  });
});

module.exports = router;
