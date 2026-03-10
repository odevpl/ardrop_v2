const db = require("../config/db");
const fs = require("fs/promises");
const path = require("path");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const marketingUploadsDir = path.resolve(__dirname, "../../uploads/marketing");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const safeUnlink = async (targetPath) => {
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (["ENOENT", "EPERM", "EACCES"].includes(error.code)) {
      return;
    }
    throw error;
  }
};

const applyActiveWindow = (query) => {
  query.andWhere((qb) => {
    qb.whereNull("startsAt").orWhere("startsAt", "<=", db.fn.now());
  });
  query.andWhere((qb) => {
    qb.whereNull("endsAt").orWhere("endsAt", ">=", db.fn.now());
  });
};

const normalizeCampaign = (campaign) => {
  if (!campaign) return campaign;
  return {
    ...campaign,
    showOnMobile: Number(campaign.showOnMobile) === 1,
    showOnTablet: Number(campaign.showOnTablet) === 1,
    showOnDesktop: Number(campaign.showOnDesktop) === 1,
  };
};

const normalizeItem = (item) => {
  if (!item) return item;
  return {
    ...item,
    isActive: Number(item.isActive) === 1,
  };
};

const getCampaigns = async ({
  page = 1,
  limit = DEFAULT_LIMIT,
  search,
  placement,
  status,
}) => {
  const safePage = parsePositiveInt(page, 1);
  const safeLimit = Math.min(parsePositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (safePage - 1) * safeLimit;

  const baseQuery = db("marketing_campaigns").select("*");
  if (search) {
    baseQuery.andWhere((qb) => {
      qb.where("name", "like", `%${search}%`).orWhere("slug", "like", `%${search}%`);
    });
  }
  if (placement) {
    baseQuery.andWhere("placement", placement);
  }
  if (status) {
    baseQuery.andWhere("status", status);
  }

  const countRow = await baseQuery
    .clone()
    .clearSelect()
    .count({ total: "id" })
    .first();
  const total = Number(countRow?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  const rows = await baseQuery
    .clone()
    .orderBy("priority", "asc")
    .orderBy("updatedAt", "desc")
    .limit(safeLimit)
    .offset(offset);

  return {
    data: rows.map(normalizeCampaign),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
};

const getCampaignById = async (campaignId) => {
  const row = await db("marketing_campaigns").select("*").where({ id: Number(campaignId) }).first();
  if (!row) {
    const error = new Error("Campaign not found");
    error.status = 404;
    throw error;
  }
  return normalizeCampaign(row);
};

const createCampaign = async (payload = {}) => {
  const now = new Date();
  const data = {
    name: String(payload.name || "").trim(),
    slug: String(payload.slug || "").trim(),
    placement: payload.placement || "home_hero",
    status: payload.status || "draft",
    layoutMode: payload.layoutMode || "auto",
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    priority: Number.isFinite(Number(payload.priority)) ? Number(payload.priority) : 100,
    showOnMobile: payload.showOnMobile === false ? 0 : 1,
    showOnTablet: payload.showOnTablet === false ? 0 : 1,
    showOnDesktop: payload.showOnDesktop === false ? 0 : 1,
    maxItems: Number.isFinite(Number(payload.maxItems)) ? Number(payload.maxItems) : 6,
    createdAt: now,
    updatedAt: now,
  };

  if (!data.name || !data.slug) {
    const error = new Error("name and slug are required");
    error.status = 400;
    throw error;
  }

  const inserted = await db.transaction(async (trx) => {
    const result = await trx("marketing_campaigns").insert(data);
    const createdId = Array.isArray(result) ? result[0] : result;

    if (data.status === "active") {
      await trx("marketing_campaigns")
        .where("placement", data.placement)
        .andWhereNot("id", createdId)
        .update({ status: "draft", updatedAt: now });
    }

    return createdId;
  });
  const campaignId = inserted;
  return getCampaignById(campaignId);
};

const updateCampaign = async ({ campaignId, payload = {} }) => {
  const existing = await db("marketing_campaigns").where({ id: Number(campaignId) }).first();
  if (!existing) {
    const error = new Error("Campaign not found");
    error.status = 404;
    throw error;
  }

  const updates = { updatedAt: new Date() };
  const allowed = [
    "name",
    "slug",
    "placement",
    "status",
    "layoutMode",
    "startsAt",
    "endsAt",
    "priority",
    "maxItems",
  ];
  allowed.forEach((key) => {
    if (payload[key] !== undefined) {
      updates[key] = payload[key];
    }
  });

  if (payload.showOnMobile !== undefined) updates.showOnMobile = payload.showOnMobile ? 1 : 0;
  if (payload.showOnTablet !== undefined) updates.showOnTablet = payload.showOnTablet ? 1 : 0;
  if (payload.showOnDesktop !== undefined) updates.showOnDesktop = payload.showOnDesktop ? 1 : 0;

  await db.transaction(async (trx) => {
    await trx("marketing_campaigns").where({ id: Number(campaignId) }).update(updates);

    if (updates.status === "active") {
      const nextPlacement = updates.placement || existing.placement;
      await trx("marketing_campaigns")
        .where("placement", nextPlacement)
        .andWhereNot("id", Number(campaignId))
        .update({ status: "draft", updatedAt: new Date() });
    }
  });
  return getCampaignById(campaignId);
};

const getCampaignItems = async ({ campaignId }) => {
  const rows = await db("marketing_campaign_items")
    .select("*")
    .where({ campaignId: Number(campaignId) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  return rows.map(normalizeItem);
};

const createCampaignItem = async ({ campaignId, payload = {}, imageFileName }) => {
  const campaign = await db("marketing_campaigns").select("id").where({ id: Number(campaignId) }).first();
  if (!campaign) {
    const error = new Error("Campaign not found");
    error.status = 404;
    throw error;
  }

  if (!imageFileName) {
    const error = new Error("Image file is required");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const data = {
    campaignId: Number(campaignId),
    title: payload.title || null,
    subtitle: payload.subtitle || null,
    imageFileName,
    imageAlt: payload.imageAlt || null,
    targetType: payload.targetType || "url",
    targetValue: String(payload.targetValue || "").trim(),
    position: Number.isFinite(Number(payload.position)) ? Number(payload.position) : 0,
    isActive: payload.isActive === false ? 0 : 1,
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    createdAt: now,
    updatedAt: now,
  };

  if (!data.targetValue) {
    const error = new Error("targetValue is required");
    error.status = 400;
    throw error;
  }

  const inserted = await db("marketing_campaign_items").insert(data);
  const itemId = Array.isArray(inserted) ? inserted[0] : inserted;
  const item = await db("marketing_campaign_items").select("*").where({ id: itemId }).first();
  return normalizeItem(item);
};

const updateCampaignItem = async ({ itemId, payload = {} }) => {
  const existing = await db("marketing_campaign_items").select("*").where({ id: Number(itemId) }).first();
  if (!existing) {
    const error = new Error("Campaign item not found");
    error.status = 404;
    throw error;
  }

  const updates = { updatedAt: new Date() };
  const allowed = [
    "title",
    "subtitle",
    "imageAlt",
    "targetType",
    "targetValue",
    "position",
    "startsAt",
    "endsAt",
  ];
  allowed.forEach((key) => {
    if (payload[key] !== undefined) {
      updates[key] = payload[key];
    }
  });
  if (payload.isActive !== undefined) updates.isActive = payload.isActive ? 1 : 0;

  await db("marketing_campaign_items").where({ id: Number(itemId) }).update(updates);
  const item = await db("marketing_campaign_items").select("*").where({ id: Number(itemId) }).first();
  return normalizeItem(item);
};

const updateCampaignItemImage = async ({ itemId, imageFileName }) => {
  if (!imageFileName) {
    const error = new Error("Image file is required");
    error.status = 400;
    throw error;
  }

  const existing = await db("marketing_campaign_items").select("*").where({ id: Number(itemId) }).first();
  if (!existing) {
    const error = new Error("Campaign item not found");
    error.status = 404;
    throw error;
  }

  await db("marketing_campaign_items")
    .where({ id: Number(itemId) })
    .update({ imageFileName, updatedAt: new Date() });

  if (existing.imageFileName && existing.imageFileName !== imageFileName) {
    await safeUnlink(path.join(marketingUploadsDir, existing.imageFileName));
  }

  const item = await db("marketing_campaign_items").select("*").where({ id: Number(itemId) }).first();
  return normalizeItem(item);
};

const deleteCampaignItem = async ({ itemId }) => {
  const existing = await db("marketing_campaign_items")
    .select("id", "imageFileName")
    .where({ id: Number(itemId) })
    .first();
  if (!existing) {
    const error = new Error("Campaign item not found");
    error.status = 404;
    throw error;
  }
  await db("marketing_campaign_items").where({ id: Number(itemId) }).del();
  if (existing.imageFileName) {
    await safeUnlink(path.join(marketingUploadsDir, existing.imageFileName));
  }
  return { ok: true };
};

const deleteCampaign = async ({ campaignId }) => {
  const existing = await db("marketing_campaigns").select("id").where({ id: Number(campaignId) }).first();
  if (!existing) {
    const error = new Error("Campaign not found");
    error.status = 404;
    throw error;
  }

  const items = await db("marketing_campaign_items")
    .select("id", "imageFileName")
    .where({ campaignId: Number(campaignId) });

  await db.transaction(async (trx) => {
    await trx("marketing_campaign_items").where({ campaignId: Number(campaignId) }).del();
    await trx("marketing_campaigns").where({ id: Number(campaignId) }).del();
  });

  await Promise.all(
    items
      .map((item) => item.imageFileName)
      .filter(Boolean)
      .map((fileName) => safeUnlink(path.join(marketingUploadsDir, fileName))),
  );

  return { ok: true };
};

const getPublicCampaignForPlacement = async ({ placement = "home_hero" }) => {
  const campaign = await db("marketing_campaigns")
    .select("*")
    .where({ placement, status: "active" })
    .modify(applyActiveWindow)
    .orderBy("priority", "asc")
    .orderBy("updatedAt", "desc")
    .first();

  if (!campaign) return null;

  const items = await db("marketing_campaign_items")
    .select("*")
    .where({ campaignId: Number(campaign.id), isActive: 1 })
    .modify(applyActiveWindow)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  return {
    campaign: normalizeCampaign(campaign),
    items: items.map(normalizeItem),
  };
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  getCampaignItems,
  createCampaignItem,
  updateCampaignItem,
  updateCampaignItemImage,
  deleteCampaignItem,
  deleteCampaign,
  getPublicCampaignForPlacement,
};
