const db = require("../config/db");
const validator = require("../helpers/validator");

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const WORKDAYS = [1, 2, 3, 4, 5];

const SETTINGS_FIELDS = [
  "orderSupportEmail",
  "orderSupportPhone",
  "returnsEmail",
  "returnsPhone",
  "defaultOrderPreparationDays",
  "shippingWorkdays",
  "sameDayShippingCutoffTime",
  "vacationModeEnabled",
  "vacationModeMessage",
  "defaultMarkupPercent",
  "minimumSalePriceGross",
  "priceRoundingMode",
  "defaultVatRate",
  "defaultUnit",
  "customerResponseTimeText",
  "emailSignature",
  "emailFooter",
  "payoutAccountHolder",
  "payoutBankAccount",
  "payoutBankName",
];

const SETTINGS_SELECT = [
  "id",
  "sellerId",
  "orderSupportEmail",
  "orderSupportPhone",
  "returnsEmail",
  "returnsPhone",
  "defaultOrderPreparationDays",
  "shippingWorkdays",
  "sameDayShippingCutoffTime",
  "vacationModeEnabled",
  "vacationModeMessage",
  "defaultMarkupPercent",
  "minimumSalePriceGross",
  "priceRoundingMode",
  "defaultVatRate",
  "defaultUnit",
  "customerResponseTimeText",
  "emailSignature",
  "emailFooter",
  "payoutAccountHolder",
  "payoutBankAccount",
  "payoutBankName",
  "createdAt",
  "updatedAt",
];

const HOLIDAYS_SELECT = [
  "id",
  "sellerId",
  "holidayDate",
  "name",
  "createdAt",
  "updatedAt",
];

const SHIPPING_METHODS_SELECT = [
  "id",
  "sellerId",
  "name",
  "isActive",
  "priceNet",
  "priceGross",
  "freeShippingAmountGross",
  "freeShippingQuantity",
  "freeShippingWeight",
  "etaMinDays",
  "etaMaxDays",
  "countries",
  "regions",
  "createdAt",
  "updatedAt",
];

const SHIPPING_EXCLUSIONS_SELECT = [
  "id",
  "sellerShippingMethodId",
  "productId",
  "createdAt",
];

const RETURN_POLICY_SELECT = [
  "id",
  "sellerId",
  "acceptsOnlineReturns",
  "returnWindowDays",
  "returnsAddressLine1",
  "returnsAddressLine2",
  "returnsCity",
  "returnsPostalCode",
  "returnsCountryCode",
  "returnsInstruction",
  "returnShippingPaidBy",
  "hasSeparateComplaintProcess",
  "complaintInstruction",
  "createdAt",
  "updatedAt",
];

const DISCOUNT_RULES_SELECT = [
  "id",
  "sellerId",
  "ruleType",
  "name",
  "isActive",
  "configJson",
  "createdAt",
  "updatedAt",
];

const SALES_SETTINGS_SELECT = [
  "id",
  "sellerId",
  "freeShippingThresholdGross",
  "upsellMessageText",
  "minimumOrderValueGross",
  "crossSellProductIds",
  "bundleOffersText",
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
  defaultOrderPreparationDays:
    row?.defaultOrderPreparationDays === null || row?.defaultOrderPreparationDays === undefined
      ? null
      : Number(row.defaultOrderPreparationDays),
  shippingWorkdays: row?.shippingWorkdays || "",
  sameDayShippingCutoffTime: row?.sameDayShippingCutoffTime || null,
  vacationModeEnabled: Boolean(row?.vacationModeEnabled),
  vacationModeMessage: row?.vacationModeMessage || "",
  defaultMarkupPercent:
    row?.defaultMarkupPercent === null || row?.defaultMarkupPercent === undefined
      ? null
      : Number(row.defaultMarkupPercent),
  minimumSalePriceGross:
    row?.minimumSalePriceGross === null || row?.minimumSalePriceGross === undefined
      ? null
      : Number(row.minimumSalePriceGross),
  priceRoundingMode: row?.priceRoundingMode || "none",
  defaultVatRate:
    row?.defaultVatRate === null || row?.defaultVatRate === undefined
      ? null
      : Number(row.defaultVatRate),
  defaultUnit: row?.defaultUnit || "pcs",
  customerResponseTimeText: row?.customerResponseTimeText || "",
  emailSignature: row?.emailSignature || "",
  emailFooter: row?.emailFooter || "",
  payoutAccountHolder: row?.payoutAccountHolder || "",
  payoutBankAccount: row?.payoutBankAccount || "",
  payoutBankName: row?.payoutBankName || "",
  createdAt: row?.createdAt || null,
  updatedAt: row?.updatedAt || null,
});

const mapHolidayRow = (row) => ({
  id: Number(row.id),
  sellerId: Number(row.sellerId),
  holidayDate: row.holidayDate,
  name: row.name || "",
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null,
});

const buildFulfillment = (settingsRow) => ({
  defaultOrderPreparationDays:
    settingsRow?.defaultOrderPreparationDays === null ||
    settingsRow?.defaultOrderPreparationDays === undefined
      ? null
      : Number(settingsRow.defaultOrderPreparationDays),
  shippingWorkdays:
    String(settingsRow?.shippingWorkdays || "")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => DAYS.includes(value)),
  sameDayShippingCutoffTime: settingsRow?.sameDayShippingCutoffTime || null,
  vacationModeEnabled: Boolean(settingsRow?.vacationModeEnabled),
  vacationModeMessage: settingsRow?.vacationModeMessage || "",
});

const parseCsvNumbers = (value) =>
  String(value || "")
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

const parseCsvStrings = (value) =>
  String(value || "")
    .split(",")
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const buildShippingMethods = (methodsRows, exclusionsRows) => {
  const exclusionsByMethodId = new Map();

  (exclusionsRows || []).forEach((row) => {
    const methodId = Number(row.sellerShippingMethodId);
    if (!exclusionsByMethodId.has(methodId)) {
      exclusionsByMethodId.set(methodId, []);
    }
    exclusionsByMethodId.get(methodId).push(Number(row.productId));
  });

  return (methodsRows || []).map((row) => ({
    id: Number(row.id),
    sellerId: Number(row.sellerId),
    name: row.name || "",
    isActive: Boolean(row.isActive),
    priceNet: row.priceNet === null || row.priceNet === undefined ? null : Number(row.priceNet),
    priceGross:
      row.priceGross === null || row.priceGross === undefined ? null : Number(row.priceGross),
    freeShippingAmountGross:
      row.freeShippingAmountGross === null || row.freeShippingAmountGross === undefined
        ? null
        : Number(row.freeShippingAmountGross),
    freeShippingQuantity:
      row.freeShippingQuantity === null || row.freeShippingQuantity === undefined
        ? null
        : Number(row.freeShippingQuantity),
    freeShippingWeight:
      row.freeShippingWeight === null || row.freeShippingWeight === undefined
        ? null
        : Number(row.freeShippingWeight),
    etaMinDays: row.etaMinDays === null || row.etaMinDays === undefined ? null : Number(row.etaMinDays),
    etaMaxDays: row.etaMaxDays === null || row.etaMaxDays === undefined ? null : Number(row.etaMaxDays),
    countries: parseCsvStrings(row.countries),
    regions: parseCsvStrings(row.regions),
    excludedProductIds: exclusionsByMethodId.get(Number(row.id)) || [],
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  }));
};

const mapReturnPolicy = (row, sellerId) => ({
  id: row?.id ? Number(row.id) : null,
  sellerId: row?.sellerId ? Number(row.sellerId) : Number(sellerId),
  acceptsOnlineReturns: Boolean(row?.acceptsOnlineReturns),
  returnWindowDays:
    row?.returnWindowDays === null || row?.returnWindowDays === undefined
      ? null
      : Number(row.returnWindowDays),
  returnsAddressLine1: row?.returnsAddressLine1 || "",
  returnsAddressLine2: row?.returnsAddressLine2 || "",
  returnsCity: row?.returnsCity || "",
  returnsPostalCode: row?.returnsPostalCode || "",
  returnsCountryCode: row?.returnsCountryCode || "PL",
  returnsInstruction: row?.returnsInstruction || "",
  returnShippingPaidBy: row?.returnShippingPaidBy || "client",
  hasSeparateComplaintProcess: Boolean(row?.hasSeparateComplaintProcess),
  complaintInstruction: row?.complaintInstruction || "",
  createdAt: row?.createdAt || null,
  updatedAt: row?.updatedAt || null,
});

const mapDiscountRule = (row) => {
  let config = {};
  try {
    config = row?.configJson ? JSON.parse(row.configJson) : {};
  } catch (error) {
    config = {};
  }

  return {
    id: Number(row.id),
    sellerId: Number(row.sellerId),
    ruleType: row.ruleType || "",
    name: row.name || "",
    isActive: Boolean(row.isActive),
    config,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
};

const mapSalesSettings = (row, sellerId) => ({
  id: row?.id ? Number(row.id) : null,
  sellerId: row?.sellerId ? Number(row.sellerId) : Number(sellerId),
  freeShippingThresholdGross:
    row?.freeShippingThresholdGross === null || row?.freeShippingThresholdGross === undefined
      ? null
      : Number(row.freeShippingThresholdGross),
  upsellMessageText: row?.upsellMessageText || "",
  minimumOrderValueGross:
    row?.minimumOrderValueGross === null || row?.minimumOrderValueGross === undefined
      ? null
      : Number(row.minimumOrderValueGross),
  crossSellProductIds: parseCsvNumbers(row?.crossSellProductIds),
  bundleOffersText: row?.bundleOffersText || "",
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
  const [
    holidaysRows,
    shippingMethodsRows,
    shippingExclusionsRows,
    returnPolicyRow,
    discountRulesRows,
    salesSettingsRow,
  ] = await Promise.all([
    db("seller_holidays")
      .select(HOLIDAYS_SELECT)
      .where({ sellerId: seller.id })
      .orderBy("holidayDate", "asc"),
    db("seller_shipping_methods")
      .select(SHIPPING_METHODS_SELECT)
      .where({ sellerId: seller.id })
      .orderBy("id", "asc"),
    db("seller_shipping_method_exclusions as ex")
      .innerJoin("seller_shipping_methods as sm", "sm.id", "ex.sellerShippingMethodId")
      .select(
        "ex.id",
        "ex.sellerShippingMethodId",
        "ex.productId",
        "ex.createdAt",
      )
      .where("sm.sellerId", seller.id)
      .orderBy("ex.id", "asc"),
    db("seller_return_policies")
      .select(RETURN_POLICY_SELECT)
      .where({ sellerId: seller.id })
      .first(),
    db("seller_discount_rules")
      .select(DISCOUNT_RULES_SELECT)
      .where({ sellerId: seller.id })
      .orderBy("id", "asc"),
    db("seller_sales_settings")
      .select(SALES_SETTINGS_SELECT)
      .where({ sellerId: seller.id })
      .first(),
  ]);

  return {
    sellerId: Number(seller.id),
    settings: mapSettingsRow(settingsRow),
    fulfillment: buildFulfillment(settingsRow),
    businessHours: buildWorkweekHours(businessHoursRows, seller.id),
    holidays: holidaysRows.map(mapHolidayRow),
    shippingMethods: buildShippingMethods(shippingMethodsRows, shippingExclusionsRows),
    returnPolicy: mapReturnPolicy(returnPolicyRow, seller.id),
    discountRules: discountRulesRows.map(mapDiscountRule),
    salesSettings: mapSalesSettings(salesSettingsRow, seller.id),
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

    if (settingsPayload.defaultOrderPreparationDays !== undefined) {
      if (
        settingsPayload.defaultOrderPreparationDays === null ||
        String(settingsPayload.defaultOrderPreparationDays).trim() === ""
      ) {
        settingsPayload.defaultOrderPreparationDays = null;
      } else {
        const normalizedDays = Number(settingsPayload.defaultOrderPreparationDays);
        if (!Number.isInteger(normalizedDays) || normalizedDays < 0 || normalizedDays > 365) {
          const error = new Error("defaultOrderPreparationDays must be an integer between 0 and 365");
          error.status = 400;
          throw error;
        }

        settingsPayload.defaultOrderPreparationDays = normalizedDays;
      }
    }

    const normalizeOptionalNumber = (value, fieldName, { min = 0, max = null } = {}) => {
      if (value === undefined) return undefined;
      if (value === null || String(value).trim() === "") return null;

      const normalized = Number(value);
      if (!Number.isFinite(normalized) || normalized < min || (max !== null && normalized > max)) {
        const error = new Error(`${fieldName} must be a number${max !== null ? ` between ${min} and ${max}` : ` >= ${min}`}`);
        error.status = 400;
        throw error;
      }

      return normalized;
    };

    if (settingsPayload.defaultMarkupPercent !== undefined) {
      settingsPayload.defaultMarkupPercent = normalizeOptionalNumber(
        settingsPayload.defaultMarkupPercent,
        "defaultMarkupPercent",
      );
    }

    if (settingsPayload.minimumSalePriceGross !== undefined) {
      settingsPayload.minimumSalePriceGross = normalizeOptionalNumber(
        settingsPayload.minimumSalePriceGross,
        "minimumSalePriceGross",
      );
    }

    if (settingsPayload.defaultVatRate !== undefined) {
      settingsPayload.defaultVatRate = normalizeOptionalNumber(
        settingsPayload.defaultVatRate,
        "defaultVatRate",
        { min: 0, max: 100 },
      );
    }

    if (settingsPayload.priceRoundingMode !== undefined) {
      const normalizedRoundingMode = String(settingsPayload.priceRoundingMode || "none").trim();
      const allowedRoundingModes = ["none", "full", "x99"];
      if (!allowedRoundingModes.includes(normalizedRoundingMode)) {
        const error = new Error(`priceRoundingMode must be one of: ${allowedRoundingModes.join(", ")}`);
        error.status = 400;
        throw error;
      }
      settingsPayload.priceRoundingMode = normalizedRoundingMode;
    }

    if (settingsPayload.defaultUnit !== undefined) {
      const normalizedUnit = String(settingsPayload.defaultUnit || "").trim().toLowerCase();
      const allowedUnits = ["pcs", "g", "l"];
      if (!allowedUnits.includes(normalizedUnit)) {
        const error = new Error(`defaultUnit must be one of: ${allowedUnits.join(", ")}`);
        error.status = 400;
        throw error;
      }
      settingsPayload.defaultUnit = normalizedUnit;
    }

    if (settingsPayload.shippingWorkdays !== undefined) {
      if (!Array.isArray(settingsPayload.shippingWorkdays)) {
        const error = new Error("shippingWorkdays must be an array");
        error.status = 400;
        throw error;
      }

      const normalizedWorkdays = [...new Set(
        settingsPayload.shippingWorkdays.map((value) => Number(value)),
      )].filter((value) => DAYS.includes(value)).sort((a, b) => a - b);

      settingsPayload.shippingWorkdays = normalizedWorkdays.join(",");
    }

    if (settingsPayload.sameDayShippingCutoffTime !== undefined) {
      settingsPayload.sameDayShippingCutoffTime = normalizeTimeValue(
        settingsPayload.sameDayShippingCutoffTime,
        "sameDayShippingCutoffTime",
      );
    }

    if (settingsPayload.vacationModeEnabled !== undefined) {
      settingsPayload.vacationModeEnabled = Boolean(settingsPayload.vacationModeEnabled);
    }

    if (settingsPayload.vacationModeMessage !== undefined) {
      settingsPayload.vacationModeMessage = normalizeNullableString(
        settingsPayload.vacationModeMessage,
      );
    }

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
      "payoutAccountHolder",
      "payoutBankName",
    ].forEach((field) => {
      if (settingsPayload[field] !== undefined) {
        settingsPayload[field] = normalizeNullableString(settingsPayload[field]);
      }
    });

    if (settingsPayload.payoutBankAccount !== undefined) {
      const normalizedBankAccount = normalizeNullableString(settingsPayload.payoutBankAccount);

      if (normalizedBankAccount === null) {
        settingsPayload.payoutBankAccount = null;
      } else {
        const compactBankAccount = normalizedBankAccount.replace(/\s+/g, "");
        if (!/^\d{26}$/.test(compactBankAccount)) {
          const error = new Error("payoutBankAccount must contain exactly 26 digits");
          error.status = 400;
          throw error;
        }

        settingsPayload.payoutBankAccount = compactBankAccount;
      }
    }

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

    if (payload.holidays !== undefined) {
      if (!Array.isArray(payload.holidays)) {
        const error = new Error("holidays must be an array");
        error.status = 400;
        throw error;
      }

      const normalizedHolidays = payload.holidays.map((holiday) => {
        const holidayDate = String(holiday?.holidayDate || "").trim();
        const name = normalizeNullableString(holiday?.name);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) {
          const error = new Error("Each holiday must have holidayDate in YYYY-MM-DD format");
          error.status = 400;
          throw error;
        }

        return { holidayDate, name };
      });

      const uniqueDates = new Set(normalizedHolidays.map((holiday) => holiday.holidayDate));
      if (uniqueDates.size !== normalizedHolidays.length) {
        const error = new Error("holidays contains duplicated holidayDate");
        error.status = 400;
        throw error;
      }

      await trx("seller_holidays").where({ sellerId }).del();
      if (normalizedHolidays.length > 0) {
        await trx("seller_holidays").insert(
          normalizedHolidays.map((holiday) => ({
            sellerId,
            holidayDate: holiday.holidayDate,
            name: holiday.name,
          })),
        );
      }
    }

    if (payload.shippingMethods !== undefined) {
      if (!Array.isArray(payload.shippingMethods)) {
        const error = new Error("shippingMethods must be an array");
        error.status = 400;
        throw error;
      }

      const normalizedMethods = payload.shippingMethods.map((method) => {
        const name = normalizeNullableString(method?.name);
        if (!name) {
          const error = new Error("Each shipping method requires name");
          error.status = 400;
          throw error;
        }

        const normalizeOptionalNumber = (value, fieldName) => {
          if (value === undefined || value === null || String(value).trim() === "") return null;
          const normalized = Number(value);
          if (!Number.isFinite(normalized) || normalized < 0) {
            const error = new Error(`${fieldName} must be a non-negative number`);
            error.status = 400;
            throw error;
          }
          return normalized;
        };

        const normalizeOptionalInteger = (value, fieldName) => {
          if (value === undefined || value === null || String(value).trim() === "") return null;
          const normalized = Number(value);
          if (!Number.isInteger(normalized) || normalized < 0) {
            const error = new Error(`${fieldName} must be a non-negative integer`);
            error.status = 400;
            throw error;
          }
          return normalized;
        };

        const etaMinDays = normalizeOptionalInteger(method?.etaMinDays, "etaMinDays");
        const etaMaxDays = normalizeOptionalInteger(method?.etaMaxDays, "etaMaxDays");
        if (etaMinDays !== null && etaMaxDays !== null && etaMinDays > etaMaxDays) {
          const error = new Error("etaMinDays cannot be greater than etaMaxDays");
          error.status = 400;
          throw error;
        }

        return {
          name,
          isActive: Boolean(method?.isActive),
          priceNet: normalizeOptionalNumber(method?.priceNet, "priceNet"),
          priceGross: normalizeOptionalNumber(method?.priceGross, "priceGross"),
          freeShippingAmountGross: normalizeOptionalNumber(
            method?.freeShippingAmountGross,
            "freeShippingAmountGross",
          ),
          freeShippingQuantity: normalizeOptionalInteger(
            method?.freeShippingQuantity,
            "freeShippingQuantity",
          ),
          freeShippingWeight: normalizeOptionalNumber(
            method?.freeShippingWeight,
            "freeShippingWeight",
          ),
          etaMinDays,
          etaMaxDays,
          countries: parseCsvStrings(Array.isArray(method?.countries) ? method.countries.join(",") : method?.countries),
          regions: parseCsvStrings(Array.isArray(method?.regions) ? method.regions.join(",") : method?.regions),
          excludedProductIds: [...new Set(
            (Array.isArray(method?.excludedProductIds) ? method.excludedProductIds : [])
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0),
          )],
        };
      });

      const allExcludedProductIds = [...new Set(
        normalizedMethods.flatMap((method) => method.excludedProductIds),
      )];

      if (allExcludedProductIds.length > 0) {
        const existingProducts = await trx("products")
          .select("id")
          .where({ sellerId })
          .whereIn("id", allExcludedProductIds);

        if (existingProducts.length !== allExcludedProductIds.length) {
          const error = new Error("Some excluded products do not belong to current seller");
          error.status = 400;
          throw error;
        }
      }

      const existingMethodIds = await trx("seller_shipping_methods")
        .select("id")
        .where({ sellerId });
      const safeExistingMethodIds = existingMethodIds.map((row) => Number(row.id)).filter(Boolean);
      if (safeExistingMethodIds.length > 0) {
        await trx("seller_shipping_method_exclusions")
          .whereIn("sellerShippingMethodId", safeExistingMethodIds)
          .del();
      }
      await trx("seller_shipping_methods").where({ sellerId }).del();

      for (const method of normalizedMethods) {
        const inserted = await trx("seller_shipping_methods").insert({
          sellerId,
          name: method.name,
          isActive: method.isActive,
          priceNet: method.priceNet,
          priceGross: method.priceGross,
          freeShippingAmountGross: method.freeShippingAmountGross,
          freeShippingQuantity: method.freeShippingQuantity,
          freeShippingWeight: method.freeShippingWeight,
          etaMinDays: method.etaMinDays,
          etaMaxDays: method.etaMaxDays,
          countries: method.countries.join(","),
          regions: method.regions.join(","),
        });

        const methodId = Array.isArray(inserted) ? inserted[0] : inserted;
        if (method.excludedProductIds.length > 0) {
          await trx("seller_shipping_method_exclusions").insert(
            method.excludedProductIds.map((productId) => ({
              sellerShippingMethodId: methodId,
              productId,
            })),
          );
        }
      }
    }

    if (payload.returnPolicy !== undefined) {
      if (typeof payload.returnPolicy !== "object" || payload.returnPolicy === null || Array.isArray(payload.returnPolicy)) {
        const error = new Error("returnPolicy must be an object");
        error.status = 400;
        throw error;
      }

      const normalizeOptionalInteger = (value, fieldName) => {
        if (value === undefined || value === null || String(value).trim() === "") return null;
        const normalized = Number(value);
        if (!Number.isInteger(normalized) || normalized < 0 || normalized > 365) {
          const error = new Error(`${fieldName} must be an integer between 0 and 365`);
          error.status = 400;
          throw error;
        }
        return normalized;
      };

      const returnPolicyPayload = {
        sellerId,
        acceptsOnlineReturns: Boolean(payload.returnPolicy.acceptsOnlineReturns),
        returnWindowDays: normalizeOptionalInteger(
          payload.returnPolicy.returnWindowDays,
          "returnWindowDays",
        ),
        returnsAddressLine1: normalizeNullableString(payload.returnPolicy.returnsAddressLine1),
        returnsAddressLine2: normalizeNullableString(payload.returnPolicy.returnsAddressLine2),
        returnsCity: normalizeNullableString(payload.returnPolicy.returnsCity),
        returnsPostalCode: normalizeNullableString(payload.returnPolicy.returnsPostalCode),
        returnsCountryCode:
          normalizeNullableString(payload.returnPolicy.returnsCountryCode)?.toUpperCase() || "PL",
        returnsInstruction: normalizeNullableString(payload.returnPolicy.returnsInstruction),
        returnShippingPaidBy:
          String(payload.returnPolicy.returnShippingPaidBy || "client").trim() === "seller"
            ? "seller"
            : "client",
        hasSeparateComplaintProcess: Boolean(payload.returnPolicy.hasSeparateComplaintProcess),
        complaintInstruction: normalizeNullableString(payload.returnPolicy.complaintInstruction),
      };

      const existingReturnPolicy = await trx("seller_return_policies")
        .select("id")
        .where({ sellerId })
        .first();

      if (existingReturnPolicy) {
        await trx("seller_return_policies")
          .where({ sellerId })
          .update({
            ...returnPolicyPayload,
            updatedAt: trx.fn.now(),
          });
      } else {
        await trx("seller_return_policies").insert(returnPolicyPayload);
      }
    }

    if (payload.discountRules !== undefined) {
      if (!Array.isArray(payload.discountRules)) {
        const error = new Error("discountRules must be an array");
        error.status = 400;
        throw error;
      }

      const allowedRuleTypes = [
        "cart_threshold",
        "quantity_threshold",
        "first_purchase",
        "loyal_customer",
        "b2b_customer",
        "happy_hours",
        "free_bonus",
      ];

      const normalizedRules = payload.discountRules.map((rule) => {
        const ruleType = String(rule?.ruleType || "").trim();
        if (!allowedRuleTypes.includes(ruleType)) {
          const error = new Error(`Invalid discount rule type: ${ruleType}`);
          error.status = 400;
          throw error;
        }

        const name = normalizeNullableString(rule?.name) || ruleType;
        const config =
          typeof rule?.config === "object" && rule.config !== null && !Array.isArray(rule.config)
            ? rule.config
            : {};

        return {
          sellerId,
          ruleType,
          name,
          isActive: Boolean(rule?.isActive),
          configJson: JSON.stringify(config),
        };
      });

      await trx("seller_discount_rules").where({ sellerId }).del();
      if (normalizedRules.length > 0) {
        await trx("seller_discount_rules").insert(normalizedRules);
      }
    }

    if (payload.salesSettings !== undefined) {
      if (typeof payload.salesSettings !== "object" || payload.salesSettings === null || Array.isArray(payload.salesSettings)) {
        const error = new Error("salesSettings must be an object");
        error.status = 400;
        throw error;
      }

      const allCrossSellProductIds = [...new Set(
        (Array.isArray(payload.salesSettings.crossSellProductIds)
          ? payload.salesSettings.crossSellProductIds
          : []
        )
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      )];

      if (allCrossSellProductIds.length > 0) {
        const existingProducts = await trx("products")
          .select("id")
          .where({ sellerId })
          .whereIn("id", allCrossSellProductIds);

        if (existingProducts.length !== allCrossSellProductIds.length) {
          const error = new Error("Some cross-sell products do not belong to current seller");
          error.status = 400;
          throw error;
        }
      }

      const salesSettingsPayload = {
        sellerId,
        freeShippingThresholdGross: normalizeOptionalNumber(
          payload.salesSettings.freeShippingThresholdGross,
          "freeShippingThresholdGross",
        ),
        upsellMessageText: normalizeNullableString(payload.salesSettings.upsellMessageText),
        minimumOrderValueGross: normalizeOptionalNumber(
          payload.salesSettings.minimumOrderValueGross,
          "minimumOrderValueGross",
        ),
        crossSellProductIds: allCrossSellProductIds.join(","),
        bundleOffersText: normalizeNullableString(payload.salesSettings.bundleOffersText),
      };

      const existingSalesSettings = await trx("seller_sales_settings")
        .select("id")
        .where({ sellerId })
        .first();

      if (existingSalesSettings) {
        await trx("seller_sales_settings")
          .where({ sellerId })
          .update({
            ...salesSettingsPayload,
            updatedAt: trx.fn.now(),
          });
      } else {
        await trx("seller_sales_settings").insert(salesSettingsPayload);
      }
    }

    const [
      settingsRow,
      businessHoursRows,
      holidaysRows,
      shippingMethodsRows,
      shippingExclusionsRows,
      returnPolicyRow,
      discountRulesRows,
      salesSettingsRow,
    ] = await Promise.all([
      trx("seller_settings").select(SETTINGS_SELECT).where({ sellerId }).first(),
      trx("seller_business_hours")
        .select(BUSINESS_HOURS_SELECT)
        .where({ sellerId })
        .orderBy("dayOfWeek", "asc"),
      trx("seller_holidays")
        .select(HOLIDAYS_SELECT)
        .where({ sellerId })
        .orderBy("holidayDate", "asc"),
      trx("seller_shipping_methods")
        .select(SHIPPING_METHODS_SELECT)
        .where({ sellerId })
        .orderBy("id", "asc"),
      trx("seller_shipping_method_exclusions as ex")
        .innerJoin("seller_shipping_methods as sm", "sm.id", "ex.sellerShippingMethodId")
        .select(
          "ex.id",
          "ex.sellerShippingMethodId",
          "ex.productId",
          "ex.createdAt",
        )
        .where("sm.sellerId", sellerId)
        .orderBy("ex.id", "asc"),
      trx("seller_return_policies")
        .select(RETURN_POLICY_SELECT)
        .where({ sellerId })
        .first(),
      trx("seller_discount_rules")
        .select(DISCOUNT_RULES_SELECT)
        .where({ sellerId })
        .orderBy("id", "asc"),
      trx("seller_sales_settings")
        .select(SALES_SETTINGS_SELECT)
        .where({ sellerId })
        .first(),
    ]);

    return {
      sellerId,
      settings: mapSettingsRow(settingsRow),
      fulfillment: buildFulfillment(settingsRow),
      businessHours: buildWorkweekHours(businessHoursRows, sellerId),
      holidays: holidaysRows.map(mapHolidayRow),
      shippingMethods: buildShippingMethods(shippingMethodsRows, shippingExclusionsRows),
      returnPolicy: mapReturnPolicy(returnPolicyRow, sellerId),
      discountRules: discountRulesRows.map(mapDiscountRule),
      salesSettings: mapSalesSettings(salesSettingsRow, sellerId),
    };
  });
};

module.exports = {
  getSellerSettings,
  updateSellerSettings,
};
