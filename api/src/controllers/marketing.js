const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const marketingService = require("../services/marketing");
const { uploadMarketingImage } = require("../middlewares/upload-image.middleware");

const router = express.Router();

const getBaseUrl = (req) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}`;
};

const withImageUrl = (req, item) => {
  if (!item) return item;
  const fileName = item.imageFileName;
  if (!fileName) return item;

  return {
    ...item,
    imageUrl: `${getBaseUrl(req)}/uploads/marketing/${fileName}`,
  };
};

router.get("/marketing/public/home-hero", roleMiddleware("ADMIN", "SELLER", "CLIENT"), async (req, res) => {
  const result = await marketingService.getPublicCampaignForPlacement({
    placement: "home_hero",
  });

  if (!result) {
    res.status(200).json({
      data: {
        campaign: null,
        items: [],
      },
    });
    return;
  }

  res.status(200).json({
    data: {
      campaign: result.campaign,
      items: result.items.map((item) => withImageUrl(req, item)),
    },
  });
});

router.get("/marketing/campaigns", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await marketingService.getCampaigns({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    placement: req.query.placement,
    status: req.query.status,
  });

  res.status(200).json({
    data: result.data,
    meta: {
      pagination: result.pagination,
    },
  });
});

router.post("/marketing/campaigns", roleMiddleware("ADMIN"), async (req, res) => {
  const campaign = await marketingService.createCampaign(req.body || {});
  res.status(201).json({ data: campaign, campaign });
});

router.patch("/marketing/campaigns/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const campaign = await marketingService.updateCampaign({
    campaignId: Number(req.params.id),
    payload: req.body || {},
  });
  res.status(200).json({ data: campaign, campaign });
});

router.delete("/marketing/campaigns/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await marketingService.deleteCampaign({
    campaignId: Number(req.params.id),
  });
  res.status(200).json({ data: result, ...result, meta: { deleted: true } });
});

router.get("/marketing/campaigns/:id/items", roleMiddleware("ADMIN"), async (req, res) => {
  const items = await marketingService.getCampaignItems({
    campaignId: Number(req.params.id),
  });
  res.status(200).json({
    data: items.map((item) => withImageUrl(req, item)),
    items: items.map((item) => withImageUrl(req, item)),
  });
});

router.post(
  "/marketing/campaigns/:id/items",
  roleMiddleware("ADMIN"),
  uploadMarketingImage.single("image"),
  async (req, res) => {
    const item = await marketingService.createCampaignItem({
      campaignId: Number(req.params.id),
      payload: req.body || {},
      imageFileName: req.file?.filename,
    });
    const normalized = withImageUrl(req, item);
    res.status(201).json({ data: normalized, item: normalized });
  },
);

router.patch("/marketing/campaign-items/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const item = await marketingService.updateCampaignItem({
    itemId: Number(req.params.id),
    payload: req.body || {},
  });
  const normalized = withImageUrl(req, item);
  res.status(200).json({ data: normalized, item: normalized });
});

router.post(
  "/marketing/campaign-items/:id/image",
  roleMiddleware("ADMIN"),
  uploadMarketingImage.single("image"),
  async (req, res) => {
    const item = await marketingService.updateCampaignItemImage({
      itemId: Number(req.params.id),
      imageFileName: req.file?.filename,
    });
    const normalized = withImageUrl(req, item);
    res.status(200).json({ data: normalized, item: normalized });
  },
);

router.delete("/marketing/campaign-items/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await marketingService.deleteCampaignItem({
    itemId: Number(req.params.id),
  });
  res.status(200).json({ data: result, ...result, meta: { deleted: true } });
});

module.exports = router;
