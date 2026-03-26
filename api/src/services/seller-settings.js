const db = require("../config/db");
const validator = require("../helpers/validator");

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const WORKDAYS = [1, 2, 3, 4, 5];

const SETTINGS_FIELDS = [
  "orderSupportEmail",
  "orderSupportPhone",
  "returnsEmail",
  "returnsPhone",
  "customerResponseTimeText",
  "emailSignature",
  "emailFooter",
];

const SETTINGS_SELECT = [
  "id",
  "sellerId",
  "orderSupportEmail",
  "orderSupportPhone",
  "returnsEmail",
  "returnsPhone",
  "customerResponseTimeText",
  "emailSignature",
  "emailFooter",
  "createdAt",
  "updatedAt",
];

const BUSINESS_HOURS_SELECT = [
  "id",
  "sellerId",
  "dayOfWeek",
  "isOpen",
  "openTime",
  "closeTime",
  "note",
  "createdAt",
  "updatedAt",
];

const normalizeNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
};

const normalizeNullableEmail = (value, fieldName) => {
  const normalized = normalizeNullableString(value);
  if (normalized === undefined || normalized === null) return normalized;

  if (!validator.email(normalized)) {
    const error = new Error(`Invalid ${fieldName} format`);
    error.status = 400;
    throw error;
  }

  return normalized;
};

const normalizeTimeValue = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;

  const normalized = String(value).trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(normalized)) {
    const error = new Error(`Invalid ${fieldName} format`);
    error.status = 400;
    throw error;
  }

  return normalized.length === 5 ? `${normalized}:00` : normalized;
};

const mapSettingsRow = (row) => ({
  id: row ? Number(row.id) : null,
  sellerId: row ? Number(row.sellerId) : null,
  orderSupportEmail: row?.orderSupportEmail || "",
  orderSupportPhone: row?.orderSupportPhone || "",
  returnsEmail: row?.returnsEmail || "",
  returnsPhone: row?.returnsPhone || "",
  customerResponseTimeText: row?.customerResponseTimeText || "",
  emailSignature: row?.emailSignature || "",
  emailFooter: row?.emailFooter || "",
  createdAt: row?.createdAt || null,
  updatedAt: row?.updatedAt || null,
});

const mapBusinessHourRow = (row, sellerId) => ({
  id: row?.id ? Number(row.id) : null,
  sellerId: row?.sellerId ? Number(row.sellerId) : Number(sellerId),
  dayOfWeek: row?.dayOfWeek ? Number(row.dayOfWeek) : null,
  isOpen: Boolean(row?.isOpen),
  openTime: row?.openTime || null,
  closeTime: row?.closeTime || null,
  note: row?.note || "",
  createdAt: row?.createdAt || null,
  updatedAt: row?.updatedAt || null,
});

const buildBusinessHours = (rows, sellerId) => {
  const byDay = new Map(
    (rows || []).map((row) => [Number(row.dayOfWeek), mapBusinessHourRow(row, sellerId)]),
  );

  return DAYS.map((dayOfWeek) => (
    byDay.get(dayOfWeek) || {
      id: null,
      sellerId: Number(sellerId),
      dayOfWeek,
      isOpen: false,
      openTime: null,
      closeTime: null,
      note: "",
      createdAt: null,
      updatedAt: null,
    }
  ));
};

const buildWorkweekHours = (rows, sellerId) => {
  const mappedRows = buildBusinessHours(rows, sellerId);
  const workdays = mappedRows.filter((row) => WORKDAYS.includes(Number(row.dayOfWeek)));
  const firstOpenDay = workdays.find((row) => row.isOpen);

  return {
    id: firstOpenDay?.id || null,
    sellerId: Number(sellerId),
    label: "Pn-Pt",
    isOpen: Boolean(firstOpenDay?.isOpen),
    openTime: firstOpenDay?.openTime || null,
    closeTime: firstOpenDay?.closeTime || null,
    note: firstOpenDay?.note || "",
  };
};

const getSellerByUserId = async (userId, trx = db) => {
  const seller = await trx("sellers").select("id").where({ userId: Number(userId) }).first();

  if (!seller) {
    const error = new Error("Seller profile not found");
    error.status = 404;
    throw error;
  }

  return seller;
};

const getSellerSettings = async ({ userId }) => {
  const seller = await getSellerByUserId(userId);

  const [settingsRow, businessHoursRows] = await Promise.all([
    db("seller_settings").select(SETTINGS_SELECT).where({ sellerId: seller.id }).first(),
    db("seller_business_hours")
      .select(BUSINESS_HOURS_SELECT)
      .where({ sellerId: seller.id })
      .orderBy("dayOfWeek", "asc"),
  ]);

  return {
    sellerId: Number(seller.id),
    settings: mapSettingsRow(settingsRow),
    businessHours: buildWorkweekHours(businessHoursRows, seller.id),
  };
};

const updateSellerSettings = async ({ userId, payload = {} }) => {
  return db.transaction(async (trx) => {
    const seller = await getSellerByUserId(userId, trx);
    const sellerId = Number(seller.id);

    const settingsPayload = {};
    SETTINGS_FIELDS.forEach((field) => {
      if (payload[field] !== undefined) {
        settingsPayload[field] = payload[field];
      }
    });

    if (settingsPayload.orderSupportEmail !== undefined) {
      settingsPayload.orderSupportEmail = normalizeNullableEmail(
        settingsPayload.orderSupportEmail,
        "orderSupportEmail",
      );
    }

    if (settingsPayload.returnsEmail !== undefined) {
      settingsPayload.returnsEmail = normalizeNullableEmail(
        settingsPayload.returnsEmail,
        "returnsEmail",
      );
    }

    [
      "orderSupportPhone",
      "returnsPhone",
      "customerResponseTimeText",
      "emailSignature",
      "emailFooter",
    ].forEach((field) => {
      if (settingsPayload[field] !== undefined) {
        settingsPayload[field] = normalizeNullableString(settingsPayload[field]);
      }
    });

    const hasSettingsUpdate = Object.keys(settingsPayload).length > 0;
    if (hasSettingsUpdate) {
      const existingSettings = await trx("seller_settings")
        .select("id")
        .where({ sellerId })
        .first();

      if (existingSettings) {
        await trx("seller_settings")
          .where({ sellerId })
          .update({
            ...settingsPayload,
            updatedAt: trx.fn.now(),
          });
      } else {
        await trx("seller_settings").insert({
          sellerId,
          ...settingsPayload,
        });
      }
    }

    if (payload.businessHours !== undefined) {
      if (typeof payload.businessHours !== "object" || payload.businessHours === null || Array.isArray(payload.businessHours)) {
        const error = new Error("businessHours must be an object");
        error.status = 400;
        throw error;
      }

      const isOpen = Boolean(payload.businessHours?.isOpen);
      const openTime = normalizeTimeValue(payload.businessHours?.openTime, "openTime");
      const closeTime = normalizeTimeValue(payload.businessHours?.closeTime, "closeTime");
      const note = normalizeNullableString(payload.businessHours?.note);

      if (isOpen && (!openTime || !closeTime)) {
        const error = new Error("Open business hours require openTime and closeTime");
        error.status = 400;
        throw error;
      }

      if (!isOpen && (openTime || closeTime)) {
        const error = new Error("Closed business hours cannot define openTime or closeTime");
        error.status = 400;
        throw error;
      }

      if (openTime && closeTime && openTime >= closeTime) {
        const error = new Error("openTime must be earlier than closeTime");
        error.status = 400;
        throw error;
      }

      for (const dayOfWeek of DAYS) {
        const existing = await trx("seller_business_hours")
          .select("id")
          .where({ sellerId, dayOfWeek })
          .first();

        const isWorkday = WORKDAYS.includes(dayOfWeek);
        const nextValues = {
          sellerId,
          dayOfWeek,
          isOpen: isWorkday ? isOpen : false,
          openTime: isWorkday && isOpen ? openTime : null,
          closeTime: isWorkday && isOpen ? closeTime : null,
          note: isWorkday ? note : null,
        };

        if (existing) {
          await trx("seller_business_hours")
            .where({ sellerId, dayOfWeek })
            .update({
              ...nextValues,
              updatedAt: trx.fn.now(),
            });
        } else {
          await trx("seller_business_hours").insert(nextValues);
        }
      }
    }

    const [settingsRow, businessHoursRows] = await Promise.all([
      trx("seller_settings").select(SETTINGS_SELECT).where({ sellerId }).first(),
      trx("seller_business_hours")
        .select(BUSINESS_HOURS_SELECT)
        .where({ sellerId })
        .orderBy("dayOfWeek", "asc"),
    ]);

    return {
      sellerId,
      settings: mapSettingsRow(settingsRow),
      businessHours: buildWorkweekHours(businessHoursRows, sellerId),
    };
  });
};

module.exports = {
  getSellerSettings,
  updateSellerSettings,
};
